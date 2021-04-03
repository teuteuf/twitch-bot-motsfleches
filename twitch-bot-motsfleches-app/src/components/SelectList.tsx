import React from "react";

interface SelectListProps {
    availableLists: string[]
    selectedList?: string
    handleChangeSelectedList: (listName: string | null) => void
}

function SelectList ({availableLists, selectedList, handleChangeSelectedList}: SelectListProps) {
    const isDefaultListInAvailableLists = availableLists.some(list => list === selectedList);
    return (
        <select value={selectedList ?? ''} onChange={(e) => handleChangeSelectedList(e.target.value || null)}>
            <option value=''>Liste par défaut</option>
            {availableLists.map(list => (
                <option key={list} value={list}>{list}</option>
            ))}
            {selectedList && !isDefaultListInAvailableLists && (
                <option value={selectedList}>{selectedList}</option>
            )}
        </select>
    )
}

export default SelectList
