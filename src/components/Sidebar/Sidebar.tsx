import { ReactNode, useState } from 'react';
import './Sidebar.css';

type SidebarItem = {
  id: string;
  label: string;
  component: ReactNode;
};

type SidebarProps = {
  items: SidebarItem[];
};

export const Sidebar = ({ items }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState(items[0].id);

  return (
    <div className="sidebar-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src="/favicon.svg" alt="Alloy" className="sidebar-logo" />
          <h1>Alloy</h1>
        </div>
        <ul className="sidebar-menu">
          {items.map((item) => (
            <li 
              key={item.id}
              className={`sidebar-item ${activeItem === item.id ? 'active' : ''}`}
              onClick={() => setActiveItem(item.id)}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </nav>
      <main className="sidebar-content">
        {items.find(item => item.id === activeItem)?.component}
      </main>
    </div>
  );
}; 