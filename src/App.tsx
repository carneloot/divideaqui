import { useState } from 'react';
import type { ExpenseGroup } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { GroupManager } from './components/GroupManager';
import './App.css';

function App() {
  const { groups, addGroup, updateGroup, deleteGroup } = useLocalStorage();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    groups.length > 0 ? groups[0].id : null
  );

  const handleCreateGroup = () => {
    const newGroup: ExpenseGroup = {
      id: crypto.randomUUID(),
      name: `Night Out ${groups.length + 1}`,
      people: [],
      items: [],
    };
    addGroup(newGroup);
    setSelectedGroupId(newGroup.id);
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 Divide Aqui</h1>
        <p className="subtitle">Split expenses with your friends</p>
      </header>
      <main className="app-main">
        {groups.length > 0 && (
          <div className="groups-selector">
            <label htmlFor="group-select">Select Group:</label>
            <select
              id="group-select"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <button onClick={handleCreateGroup} className="new-group-btn">
              + New Group
            </button>
          </div>
        )}
        {selectedGroup ? (
          <GroupManager
            group={selectedGroup}
            onUpdateGroup={updateGroup}
            onDeleteGroup={(id) => {
              deleteGroup(id);
              if (groups.length > 1) {
                const remainingGroups = groups.filter(g => g.id !== id);
                setSelectedGroupId(remainingGroups[0]?.id || null);
              } else {
                setSelectedGroupId(null);
              }
            }}
          />
        ) : (
          <div className="welcome-screen">
            <h2>Welcome! 👋</h2>
            <p>Create your first expense group to get started.</p>
            <button onClick={handleCreateGroup} className="create-first-group-btn">
              Create Your First Group
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;