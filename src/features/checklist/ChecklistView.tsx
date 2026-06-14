import { useState, useEffect, type FormEvent } from 'react';
import styles from './ChecklistView.module.css';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'Do we have a clear draw on liquidity?', checked: false },
  { id: '2', text: 'Are we in our predefined times to start hunting? (Check for news and macros) TIME IS OUR IMPORTANT VARIABLE', checked: false },
  { id: '3', text: 'Liquidity raid happened after our time window?', checked: false },
  { id: '4', text: 'Is there a clear breaker?', checked: false },
  { id: '5', text: 'Is there an FVG aligned with the breaker?', checked: false },
];

const STORAGE_KEY = 'tw-checklist-unicorn';

function loadItems(): ChecklistItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

export default function ChecklistView() {
  const [items, setItems] = useState<ChecklistItem[]>(loadItems);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const item: ChecklistItem = {
      id: Date.now().toString(),
      text: newItem.trim(),
      checked: false,
    };
    setItems((prev) => [...prev, item]);
    setNewItem('');
  };

  const resetAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
  };

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;
  const percent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Unicorn Checklist</h2>
          <p className={styles.subtitle}>Complete each item before entering a trade</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.resetAllBtn} onClick={resetAll}>
            Reset All
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progress}>
        <div className={styles.progressHeader}>
          <span className={styles.progressPercent}>{percent}%</span>
          <span className={styles.progressText}>
            {checkedCount} of {totalCount} completed
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Items */}
      <div className={styles.checklist}>
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.item} ${item.checked ? styles.itemChecked : ''}`}
            onClick={() => toggleItem(item.id)}
          >
            <div className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}>
              {item.checked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className={`${styles.itemText} ${item.checked ? styles.itemTextChecked : ''}`}>
              {item.text}
            </span>
            <button
              className={styles.deleteItemBtn}
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      <form className={styles.addItemForm} onSubmit={addItem}>
        <input
          className={styles.addInput}
          placeholder="Add a custom checklist item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <button type="submit" className={styles.addBtn}>
          Add Item
        </button>
      </form>
    </div>
  );
}
