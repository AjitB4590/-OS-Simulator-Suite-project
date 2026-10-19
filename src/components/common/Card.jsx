/**
 * Reusable Card container component.
 * Provides consistent elevation, padding, glassmorphic styling,
 * optional action buttons, and accessible collapsible header toggles.
 */

import { useState } from 'react';

/**
 * @param {{
 *   title?: string,
 *   subtitle?: string,
 *   action?: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string,
 *   collapsible?: boolean,
 *   defaultCollapsed?: boolean,
 *   id?: string
 * }} props
 */
export function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  id,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section className={`card ${className}`} id={id}>
      {(title || action || collapsible) && (
        <div
          className="card-header"
          style={{ cursor: collapsible ? 'pointer' : 'default', userSelect: 'none' }}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          aria-expanded={collapsible ? !isCollapsed : undefined}
          onKeyDown={
            collapsible
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsCollapsed(!isCollapsed);
                  }
                }
              : undefined
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {collapsible && (
              <span className="collapse-toggle-icon" aria-hidden="true" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isCollapsed ? '▶' : '▼'}
              </span>
            )}
            <div>
              {title && <h2>{title}</h2>}
              {subtitle && <p className="hint-text">{subtitle}</p>}
            </div>
          </div>
          {action && (
            <div className="card-action" onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
        </div>
      )}
      {!isCollapsed && <div className="card-body">{children}</div>}
    </section>
  );
}
