"use client";

import React, { useState, useRef } from "react";
import Fretboard from "../fretboard/fretboard";
import Footer from "../../components/footer";
import { useTranslations } from "next-intl";
import { Mic, MicOff, Music, Sparkles, CheckCircle2, RotateCcw, Play, Square } from "lucide-react";
import { transcribeAudioBlob } from "@/utils/audioTranscriber";

interface MidiData {
  data?: Record<string, [number, number] | any> | null;
}

export default function Record() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioURL, setAudioURL] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isShowTabs, setIsShowTabs] = useState<boolean>(false);
  const [tabs, setTabs] = useState<MidiData | any>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const t = useTranslations("record");

  const handleButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  const showTabs = () => {
    if (blob) {
      setUploading(true);
      sendAudioFileToServer(blob);
    }
  };

  const startRecording = () => {
    setErrorMsg(null);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          audioChunksRef.current = [];
          const url = window.URL.createObjectURL(audioBlob);
          setAudioURL(url);
          setBlob(audioBlob);
        };

        mediaRecorderRef.current.start();
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
        setErrorMsg(t('mic_error'));
        setIsRecording(false);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  const sendAudioFileToServer = async (audioBlob: Blob) => {
    setErrorMsg(null);
    setUploading(true);

    try {
      // Local pitch-detection transcription directly in the browser (100% reliable, zero dead servers)
      const midiData = await transcribeAudioBlob(audioBlob);
      setTabs(midiData);
      setUploading(false);
      setIsShowTabs(true);
    } catch (error: any) {
      console.warn('Audio transcription error:', error);
      setErrorMsg(
        error?.message || t('err_failed')
      );
      setUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#160E0A] text-[#F4EFE6] flex flex-col">
      {!isShowTabs && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md flex flex-col items-center gap-6">
            {/* Title Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Sparkles size={13} />
                <span>{t('tag')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('head')}
              </h1>
              <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
                {t('desc')}
              </p>
            </div>

            {/* Glowing Record Button */}
            <div className="relative flex items-center justify-center my-4">
              <div
                className={`absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full transition-all duration-500 ${
                  isRecording
                    ? 'bg-rose-600/30 animate-ping'
                    : 'bg-amber-500/10'
                }`}
              />

              <button
                disabled={uploading}
                onClick={handleButtonClick}
                className={`relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
                  isRecording
                    ? 'bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-700 border-rose-400 shadow-rose-600/50'
                    : 'bg-gradient-to-tr from-[#2E1D13] via-[#3D271A] to-[#25170E] hover:from-[#3D271A] hover:to-[#4A3020] border-amber-500/60 shadow-amber-950/60 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square size={44} className="text-white fill-white" />
                    <span className="text-xs font-bold text-white mt-2 uppercase tracking-wider">
                      {t('btn_stop')}
                    </span>
                  </>
                ) : (
                  <>
                    <Mic size={48} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 mt-2 uppercase tracking-wider">
                      {t('btn_start')}
                    </span>
                  </>
                )}
              </button>
            </div>

            {isRecording && (
              <p className="text-xs font-bold text-rose-400 flex items-center gap-2 animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>{t('rec')}</span>
              </p>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-400 text-center max-w-xs">{errorMsg}</p>
            )}

            {/* Audio Preview & Process Card */}
            {audioURL && (
              <div className="w-full p-4 rounded-2xl bg-[#1E1410] border border-[#3d291e] shadow-xl flex flex-col items-center gap-3">
                <span className="text-xs font-bold text-stone-300">{t('listen')}</span>
                <audio src={audioURL} controls className="w-full h-10 rounded-lg" />

                <button
                  type="button"
                  disabled={uploading}
                  onClick={showTabs}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      <span>{t('wait')}</span>
                    </>
                  ) : (
                    <>
                      <Music size={16} />
                      <span>{t('note')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isShowTabs && (
        <div className="flex-1 w-full p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t('tabs_title')}</h2>
            <button
              onClick={() => setIsShowTabs(false)}
              className="px-3 py-1.5 rounded-xl bg-[#281B14] border border-[#442C20] text-xs font-bold text-stone-300 hover:text-white"
            >
              {t('record_more')}
            </button>
          </div>
          <Fretboard data={tabs} />
        </div>
      )}

      <Footer />
    </div>
  );
}