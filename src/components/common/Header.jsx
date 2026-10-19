/**
 * Top Application Header and Navigation Bar component.
 * Displays the suite title, branding, navigation tabs for all 3 modules,
 * and the theme toggle control.
 */

import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle.jsx';

/**
 * @param {{ isDark: boolean, onToggleTheme: () => void }} props
 */
export function Header({ isDark, onToggleTheme }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-logo-badge" aria-hidden="true">
            OS
          </div>
          <div className="brand-text">
            <h1>OS Simulator Suite</h1>
            <span>Academic Algorithm Workbench</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main Navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            CPU Scheduling
          </NavLink>
          <NavLink
            to="/deadlock"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Deadlock
          </NavLink>
          <NavLink
            to="/memory"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Memory Allocation
          </NavLink>
        </nav>

        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
