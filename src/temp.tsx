import React, { useState } from 'react';

const PointerTable: React.FC = () => {
  const [selectedText, setSelectedText] = useState<string>('');

  const handlePointerDown = (event: React.PointerEvent<HTMLTableElement>) => {
    const target = event.target as HTMLElement;
    setSelectedText(target.textContent || '');
  };

  return (
    <div>
      <h3>📌 선택한 셀 내용:</h3>
      <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>{selectedText}</div>

      <table
        onPointerDown={handlePointerDown}
        style={{ borderCollapse: 'collapse', width: '100%', cursor: 'pointer' }}
      >
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: '8px' }}>Name</th>
            <th style={{ border: '1px solid black', padding: '8px' }}>Age</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid black', padding: '8px' }}>Alice</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>25</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid black', padding: '8px' }}>Bob</td>
            <td style={{ border: '1px solid black', padding: '8px' }}>30</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PointerTable;
