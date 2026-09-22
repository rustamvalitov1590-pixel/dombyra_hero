"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Fretboard from "../fretboard/fretboard";
import Footer from "../../components/footer";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { Upload as UploadIcon, Mic, Sparkles, Music, CheckCircle2, AlertCircle } from 'lucide-react';
import { transcribeAudioBlob } from '@/utils/audioTranscriber';

interface MidiData {
  data?: Record<string, [number, number] | any> | null;
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [midiNumbers, setMidiNumbers] = useState<MidiData | any>(null);
  const [uploadStatus, setUploadStatus] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const t = useTranslations('upload');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    if (!file) {
      setMessage(t('err_no_file'));
      setUploading(false);
      return;
    }

    try {
      // Local pitch-detection transcription directly in browser
      const midiData = await transcribeAudioBlob(file);
      setMidiNumbers(midiData);
      setUploadStatus(true);
    } catch (error: any) {
      console.error('Transcription error:', error);
      setMessage(error?.message || t('err_failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] flex flex-col">
      {!uploadStatus && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md flex flex-col items-center gap-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Sparkles size={13} />
                <span>{t('tag')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('headline')}
              </h1>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {t('desc')}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="w-full p-6 rounded-3xl bg-gradient-to-br from-[#241710] to-[#1A110B] border border-[#3d291e] shadow-xl flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-stone-300">
                  {t('choose_file')}
                </label>
                <input
                  type="file"
                  id="file"
                  name="file"
                  onChange={handleFileChange}
                  accept="audio/*"
                  className="block w-full text-xs text-stone-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#382315] file:text-amber-300 hover:file:bg-[#482E1E] file:cursor-pointer cursor-pointer border border-[#482E1E] rounded-xl p-2 bg-[#1A1009]"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    <span>{t('wait')}</span>
                  </>
                ) : (
                  <>
                    <UploadIcon size={16} />
                    <span>{t('upload')}</span>
                  </>
                )}
              </button>

              {message && (
                <p className="text-xs text-rose-400 text-center">{message}</p>
              )}
            </form>

            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>{t('or_record_label')}</span>
              <Link
                href="/record"
                className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1 underline underline-offset-2"
              >
                <Mic size={13} />
                <span>{t("or_record")}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {uploadStatus && (
        <div className="flex-1 w-full p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t('tabs_title')}</h2>
            <button
              onClick={() => setUploadStatus(false)}
              className="px-3 py-1.5 rounded-xl bg-[#281B14] border border-[#442C20] text-xs font-bold text-stone-300 hover:text-white"
            >
              {t('upload_another')}
            </button>
          </div>
          <Fretboard data={midiNumbers} />
        </div>
      )}

      <Footer />
    </div>
  );
}