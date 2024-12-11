import React from 'react';

export type FilterType = 'all' | 'completed' | 'unchecked' | 'delete';

interface FilterProps {
  filter: FilterType;
  onChange: (filter: FilterType) => void;
}

const Filter: React.FC<FilterProps> = ({ filter, onChange }) => {
  return (
    <select value={filter} onChange={(e) => onChange(e.target.value as FilterType)}>
      <option value="all">すべてのタスク</option>
      <option value="completed">完了したタスク</option>
      <option value="unchecked">現在のタスク</option>
      <option value="delete">ごみ箱</option>
    </select>
  );
};

export default Filter;