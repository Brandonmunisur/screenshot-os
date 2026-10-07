'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, LoaderCircle, Sparkles, UploadCloud, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { trackBetaEvent } from '@/lib/betaAnalytics';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function extensionFor(file) {
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/webp') return 'webp';
  return 'png';
}

export default function UploadDropzone({ userId, compact = false, autoAnalyze = true }) {
  const inputRef = useRef(null);
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState('idle');
  const [error, setError] = useState('');

  const busy = stage !== 'idle';

  async function handleFile(file) {
    setError('');

    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Use a PNG, JPG or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Screenshot must be smaller than 10 MB.');
      return;
    }

    const supabase = createClient();
    const storageId = crypto.randomUUID();
    const path = `${userId}/${storageId}.${extensionFor(file)}`;

    try {
      setStage('uploading');

      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: row, error: rowError } = await supabase
        .from('screenshots')
        .insert({
          user_id: userId,
          storage_path: path,
          original_name: file.name || `screenshot.${extensionFor(file)}`,
          mime_type: file.type,
          file_size: file.size,
          status: 'uploaded',
        })
        .select('id')
        .single();

      if (rowError || !row) {
        await supabase.storage.from('screenshots').remove([path]);
        throw rowError || new Error('Could not create the screenshot record.');
      }

      void trackBetaEvent(userId, 'screenshot_uploaded', {
        mime_type: file.type,
        file_size: file.size,
        auto_analyze: autoAnalyze,
      });

      if (inputRef.current) inputRef.current.value = '';

      // Show the saved screenshot immediately. AI analysis is optional per account setting.
      router.refresh();

      if (autoAnalyze) {
        setStage('analyzing');

        const analysisResponse = await fetch(`/api/screenshots/${row.id}/analyze`, {
          method: 'POST',
        });
        const analysisPayload = await analysisResponse.json().catch(() => ({}));

        if (!analysisResponse.ok) {
          throw new Error(analysisPayload.error || 'The screenshot was saved, but AI analysis failed.');
        }

        void trackBetaEvent(userId, 'analysis_completed', {
          screenshot_id: row.id,
        });

        router.refresh();
      }
    } catch (uploadError) {
      setError(uploadError?.message || 'Upload failed. Try again.');
      router.refresh();
    } finally {
      setStage('idle');
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  const buttonLabel = stage === 'uploading'
    ? 'Uploading...'
    : stage === 'analyzing'
      ? 'Analysing...'
      : 'Add screenshot';

  if (compact) {
    return (
      <div className="compact-upload-wrap">
        <input
          ref={inputRef}
          className="file-input-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button className="upload-button" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <LoaderCircle size={17} className="spin" /> : <ImagePlus size={17} />}
          {buttonLabel}
        </button>
        {error && (
          <button className="upload-error-mini" onClick={() => setError('')} title={error}>
            <X size={13} /> Check analysis
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        className="file-input-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        className={`real-dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        <span className="dropzone-icon">
          {busy ? <LoaderCircle className="spin" /> : <UploadCloud />}
        </span>
        <strong>
          {stage === 'uploading'
            ? 'Saving your screenshot…'
            : stage === 'analyzing'
              ? 'Screenshot saved — AI is understanding it…'
              : 'Drop a screenshot here'}
        </strong>
        <span>
          {stage === 'analyzing'
            ? <><Sparkles size={13} /> Creating title, category, intent and actions</>
            : 'or click to choose a PNG, JPG or WebP · max 10 MB'}
        </span>
      </button>
      {error && (
        <div className="form-message error upload-error">
          {error} The screenshot may still be saved in your library; open it to retry analysis.
        </div>
      )}
    </div>
  );
}
