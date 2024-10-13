import React, { useState, useEffect, useRef } from 'react'
import Transcription from './Transcription'
import Translation from './Translation'

export default function Information(props) {
    const {output} = props
    const [tab, setTab] = useState('transcription')
    const [translation, setTranslation] = useState(null)
    const [translating, setTranslating] = useState(null)
    const [toLanguage, setToLanguage] = useState('Select language')

    const worker = useRef()

    useEffect(() => {
        if (!worker.current) {
          worker.current = new Worker(new URL('../utils/translate.worker.js', import.meta.url), {
            type: 'module'
          })
        }
    
        const onMessageReceived = async (e) => {
          switch (e.data.status) {
            case 'initiate' :
              console.log('DOWNLOADING')
              break;
            case 'progress' :
              console.log('LOADING')
              break;
            case 'update' :
              setTranslation(e.data.output)
              break;
            case 'complete' :
              setTranslating(false)
              console.log('DONE')
              break;
          }
        }
    
        worker.current.addEventListener('message', onMessageReceived)
    
        return () => worker.current.removeEventListener('message', onMessageReceived)
    
    })

    const textElement = tab === 'transcription' ? output.map(val => val.text) : translation || 'No translation'

    function handleCopy () {
        navigator.clipboard.writeText(textElement)
    }

    function handleDownload () {
        const element = document.createElement('a')
        const file = new blob([textElement], {type: 'text/plain'})
        element.href = URL.createObjectURL(file)
        element.download = `Textify_${(new Date()).toString()}.txt`
        document.body.appendChild(element)
        element.click()
    }

    function generateTranslation () {
        if (translating || toLanguage === 'Select language') {
            return
        }

        setTranslating(true)

        worker.current.postMessage({
            text: output.map(val => val.text),
            src_lang: 'eng_latin',
            tge_lang: toLanguage 
        })
    }

  return (
    <main className='flex-1 p-4 pb-20 grid grid-cols-2 justify-center gap-3 sm:gap-4 text-center max-w-prose w-full'>
        <h1 className='font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap'>Your <span className='text-blue-400 bold'>Transcription</span></h1>
        <div className='flex items-center mx-auto bg-white shadow rounded-full overflow-hidden'>
            <button onClick={() => setTab('transcription')} className={'px-4 py-1 duration-200' + (tab === 'transcription' ? 'bg-blue-300 text-white' : 'text-blue-400 hover:text-blue-600')}>Transcription</button>
            <button onClick={() => setTab('translation')} className={'px-4 py-1 duration-200' + (tab === 'translation' ? 'bg-blue-300 text-white' : 'text-blue-400 hover:text-blue-600')}>Translation</button>
        </div>
        <div className='flex flex-col my-8'>
            {tab === 'transcription' ? (
                <Transcription {...props} textElement={textElement} />
            ) : (
                <Translation {...props} toLanguage={toLanguage} translating={translating} textElement={textElement} setTranslating={setTranslating} setTranslation={setTranslation} setToLanguage={setToLanguage} generateTranslation={generateTranslation} />
            )}
        </div>
        <div className='flex items-center gap-4 mx-auto'>
            <button onClick={handleCopy} title='Copy' className='bg-white text-blue-300 px-2 aspect-square grid place-items-center rounded hover:text-blue-500 duration-200'>
            <i className="fa-solid fa-copy"></i>
            </button>
            <button onClick={handleDownload} title='Download' className='bg-white text-blue-300 px-2 aspect-square grid place-items-center rounded hover:text-blue-500 duration-200'>
            <i className="fa-solid fa-download"></i>
            </button>
        </div>
    </main>
  )
}
