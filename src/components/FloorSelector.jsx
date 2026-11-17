import React from 'react';

export default function FloorSelector({ selectedFloor, onSelectFloor }) {
  const floors = [1, 2, 3];

  return (
    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:items-center">
      {floors.map((floor) => {
        const isSelected = selectedFloor === floor;

        return (
          <button
            key={floor}
            onClick={() => onSelectFloor(floor)}
            className={`cursor-pointer py-2 px-3 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm text-center transition-all duration-200 border ${
              isSelected
                ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
            }`}
          >
            Floor {floor}
          </button>
        );
      })}
    </div>
  );
}
