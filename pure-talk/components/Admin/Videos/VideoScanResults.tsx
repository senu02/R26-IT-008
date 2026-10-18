import type { VideoTextScan } from '@/app/services/videos/actions';

export default function VideoScanResults({ scan }: { scan: VideoTextScan }) {
  const text = scan.modality_results?.visible_text;
  const audio = scan.modality_results?.audio;
  const analysis = audio?.analysis;
  const complete = scan.status === 'complete';
  const decision = scan.is_toxic ? 'Toxicity detected' : complete
    ? 'No toxicity detected in the analysed content' : 'Analysis incomplete — review required';

  return (
    <div className="mt-3 space-y-3 text-xs">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-md border border-current/20 px-2 py-1">Status: {scan.status}</span>
        <span className={`rounded-md border border-current/20 px-2 py-1 ${scan.is_toxic ? 'text-red-500' : complete ? 'text-emerald-500' : 'text-amber-500'}`}>
          {decision}
        </span>
        <span className="rounded-md border border-current/20 px-2 py-1">Action: {scan.action.replaceAll('_', ' ')}</span>
      </div>
      <p>Highest observed score: {Math.round(scan.max_score * 100)}%. This is a model score, not measured accuracy.</p>
      {scan.error && <p role="alert" className="text-amber-500">{scan.error}</p>}
      {!audio && <p className="text-amber-500">This saved scan covers screen text only. Run a new video scan to include audio.</p>}

      <div className="rounded-md border border-current/20 p-3 space-y-2">
        <p className="font-semibold">Screen text · {text?.status || scan.status}</p>
        <p>{scan.observation_count} observations · sampled every {scan.sampling_interval} seconds</p>
        {text && <p>Highest screen-text score: {Math.round(text.max_score * 100)}%</p>}
        {scan.observation_count === 0 && complete && <p>No readable text was detected in the sampled frames.</p>}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {scan.observations.map((observation, index) => (
            <div key={`${observation.frame_number}-${index}`} className="rounded-md border border-current/20 p-2">
              <div className="flex justify-between gap-3">
                <span>{observation.timestamp_seconds.toFixed(1)}s · OCR {Math.round(observation.ocr_confidence * 100)}%</span>
                <span className={observation.is_toxic ? 'font-bold text-red-500' : ''}>{Math.round(observation.toxicity_score * 100)}%</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap break-words">{observation.extracted_text}</p>
            </div>
          ))}
        </div>
      </div>

      {audio && (
        <div className="rounded-md border border-current/20 p-3 space-y-2">
          <p className="font-semibold">Video audio · {audio.status.replaceAll('_', ' ')}</p>
          {audio.status === 'not_present' && <p>This video has no audio track.</p>}
          {audio.duration_seconds != null && <p>{audio.duration_seconds.toFixed(1)} seconds of audio extracted</p>}
          {analysis?.transcribed_text && <p className="whitespace-pre-wrap break-words"><strong>Transcript:</strong> {analysis.transcribed_text}</p>}
          {analysis && audio.status !== 'failed' && (
            <>
              <p>Audio toxicity score: {Math.round(analysis.max_score * 100)}% · {analysis.is_toxic ? 'Toxicity detected' : 'No toxicity detected'}</p>
              {analysis.fusion && <p>Audio action: {analysis.fusion.action.replaceAll('_', ' ')} · Dominant emotion: {analysis.fusion.dominant_emotion || 'Unavailable'}</p>}
              <div className="flex flex-wrap gap-2">
                {Object.entries(analysis.labels).map(([label, score]) => (
                  <span key={label} className="rounded border border-current/20 px-2 py-1">{label.replaceAll('_', ' ')}: {Math.round(score * 100)}%</span>
                ))}
              </div>
              {analysis.fusion?.label_breakdown && (
                <details>
                  <summary className="cursor-pointer">Transcript and emotion evidence</summary>
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-left">
                      <thead><tr><th className="p-1">Label</th><th className="p-1">Transcript</th><th className="p-1">Emotion contribution</th><th className="p-1">Final</th></tr></thead>
                      <tbody>{Object.entries(analysis.fusion.label_breakdown).map(([label, scores]) => (
                        <tr key={label}><td className="p-1">{label.replaceAll('_', ' ')}</td><td className="p-1">{Math.round(scores.text_score * 100)}%</td><td className="p-1">+{Math.round(scores.audio_contribution * 100)}%</td><td className="p-1">{Math.round(scores.final_score * 100)}%</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
