import React from 'react'

export default function Button({color ,icon , text }) {
  return (
      <button
          type='button'
          style={{  color }}
      className={`text-sm p-2 hover:drop-shadow-xl w-32 flex items-center justify-evenly rounded-xl mt-3 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white
          `}>
          {icon}
          {text}
      </button>
  )
}
