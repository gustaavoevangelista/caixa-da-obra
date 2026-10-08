import { useEffect, useRef, useState } from 'react';
import {
	joinRecognitionResults,
	parseVoiceCommand,
	type VoiceContext,
	type VoiceDraft,
} from '../../voice-command';
import type { Project, SavedCategories } from '../types';

// Minimal Web Speech API surface; not in TypeScript's DOM lib (and prefixed in Safari).
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionLike = {
	lang: string;
	interimResults: boolean;
	continuous: boolean;
	maxAlternatives: number;
	onresult: ((e: { results: ArrayLike<SpeechRecognitionResultLike> }) => void) | null;
	onerror: ((e: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
	abort: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
	if (typeof window === 'undefined') return null;
	const w = window as unknown as {
		SpeechRecognition?: SpeechRecognitionCtor;
		webkitSpeechRecognition?: SpeechRecognitionCtor;
	};
	return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
	'not-allowed': 'Permita o acesso ao microfone para usar comandos de voz.',
	'service-not-allowed': 'Permita o acesso ao microfone para usar comandos de voz.',
	'no-speech': 'Não ouvi nada. Tente novamente.',
	'audio-capture': 'Nenhum microfone encontrado.',
	network: 'Sem ligação ao serviço de voz. Tente novamente.',
};

// We listen in continuous mode and decide ourselves when the command is over,
// so pauses mid-sentence don't cut the user off and timing is the same in every browser.
/** Silence after the last recognised words before the command is processed. */
export const VOICE_SILENCE_TIMEOUT_MS = 4000;
/** How long to wait for the first words before giving up. */
export const VOICE_NO_SPEECH_TIMEOUT_MS = 6000;
/** Hard cap on a single listening session. */
export const VOICE_MAX_LISTEN_MS = 20000;
/** Guards against a restart loop if the browser keeps ending runs instantly. */
const VOICE_MAX_RESTARTS = 15;

export type VoiceStatus = 'idle' | 'listening' | 'error';

export function useVoiceCommand({
	categories,
	projects,
	onDraft,
}: {
	categories: SavedCategories;
	projects: Project[];
	onDraft: (draft: VoiceDraft) => void;
}) {
	const [supported, setSupported] = useState(false);
	const [status, setStatus] = useState<VoiceStatus>('idle');
	const [transcript, setTranscript] = useState('');
	const [error, setError] = useState<string | null>(null);
	const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
	// Bumped on every start/cancel so late callbacks from an old session are ignored.
	const sessionRef = useRef(0);
	const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// True once we (timer or CONCLUIR) ended the session, vs. the browser ending a run.
	const stopRequestedRef = useRef(false);

	const clearTimers = () => {
		if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
		if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
		silenceTimerRef.current = null;
		maxTimerRef.current = null;
	};

	// Checked after mount so server and client render the same markup.
	useEffect(() => {
		setSupported(getRecognitionCtor() !== null);
	}, []);

	useEffect(
		() => () => {
			clearTimers();
			recognitionRef.current?.abort();
		},
		[],
	);

	const resolveTranscript = (text: string) => {
		const ctx: VoiceContext = {
			expense: categories.expense,
			income: categories.income,
			projects: projects.filter((p) => p.status === 'active'),
		};
		onDraft(parseVoiceCommand(text, ctx));
		setStatus('idle');
		setTranscript('');
	};

	const start = () => {
		const Ctor = getRecognitionCtor();
		if (!Ctor || status === 'listening') return;

		const session = ++sessionRef.current;
		const recognition = new Ctor();
		recognition.lang = 'pt-PT';
		recognition.interimResults = true;
		recognition.continuous = true;
		recognition.maxAlternatives = 1;

		// Text from earlier browser runs of this session (see the restart in onend).
		let committedText = '';
		// Includes interim words: some browsers drop a pending segment on stop().
		let heardText = '';
		let failed = false;
		let restarts = 0;
		stopRequestedRef.current = false;

		// stop() (not abort()) so the browser still delivers pending results before onend.
		const requestStop = () => {
			stopRequestedRef.current = true;
			recognition.stop();
		};
		const armSilenceTimer = (ms: number) => {
			if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
			silenceTimerRef.current = setTimeout(requestStop, ms);
		};

		recognition.onresult = (e) => {
			if (sessionRef.current !== session) return;
			const segments: string[] = [committedText];
			for (let i = 0; i < e.results.length; i++) {
				segments.push(e.results[i][0].transcript);
			}
			heardText = joinRecognitionResults(segments);
			setTranscript(heardText);
			armSilenceTimer(VOICE_SILENCE_TIMEOUT_MS);
		};
		recognition.onerror = (e) => {
			if (sessionRef.current !== session) return;
			// Silence is handled by our own timers, not the browser's.
			if (e.error === 'aborted' || e.error === 'no-speech') return;
			failed = true;
			clearTimers();
			setError(ERROR_MESSAGES[e.error] ?? 'Não foi possível ouvir o comando.');
			setStatus('error');
		};
		recognition.onend = () => {
			if (sessionRef.current !== session) return;
			// Android Chrome and iOS Safari end the run after a short pause even in
			// continuous mode. If our timers haven't ended it, keep listening.
			if (!failed && !stopRequestedRef.current && restarts < VOICE_MAX_RESTARTS) {
				restarts += 1;
				committedText = heardText;
				try {
					recognition.start();
					return;
				} catch (err) {
					console.error('Speech recognition restart error:', err);
				}
			}
			clearTimers();
			recognitionRef.current = null;
			if (failed) return;
			if (heardText.trim()) {
				resolveTranscript(heardText.trim());
			} else {
				setError('Não ouvi nada. Tente novamente.');
				setStatus('error');
			}
		};

		recognitionRef.current = recognition;
		setTranscript('');
		setError(null);
		setStatus('listening');
		try {
			recognition.start();
			armSilenceTimer(VOICE_NO_SPEECH_TIMEOUT_MS);
			maxTimerRef.current = setTimeout(requestStop, VOICE_MAX_LISTEN_MS);
		} catch (err) {
			console.error('Speech recognition start error:', err);
			clearTimers();
			recognitionRef.current = null;
			setError('Não foi possível iniciar o microfone.');
			setStatus('error');
		}
	};

	// Ends listening now; whatever was heard so far is still processed.
	const stop = () => {
		clearTimers();
		stopRequestedRef.current = true;
		recognitionRef.current?.stop();
	};

	const cancel = () => {
		sessionRef.current += 1;
		clearTimers();
		recognitionRef.current?.abort();
		recognitionRef.current = null;
		setStatus('idle');
		setTranscript('');
		setError(null);
	};

	return { supported, status, transcript, error, start, stop, cancel };
}
