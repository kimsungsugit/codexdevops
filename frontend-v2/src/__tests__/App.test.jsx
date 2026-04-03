import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api.js', () => ({
  getInitialTheme: () => 'light',
  saveTheme: vi.fn(),
  loadJenkinsConfig: () => ({}),
  saveJenkinsConfig: vi.fn(),
  getUsername: () => 'testuser',
  setUsername: vi.fn(),
}));

vi.mock('../views/Dashboard.jsx', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));
vi.mock('../views/Detail.jsx', () => ({
  default: () => <div data-testid="detail">Detail</div>,
}));
vi.mock('../views/Settings.jsx', () => ({
  default: () => <div data-testid="settings">Settings</div>,
}));

globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ status: 'ok', version: '1.0' }),
  })
);

const { default: App } = await import('../App.jsx');

async function renderApp() {
  const view = render(<App />);
  await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith('/api/health'));
  return view;
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.removeAttribute('data-theme');
  });

  it('renders header with brand name', async () => {
    await renderApp();
    expect(screen.getByText('DevOps Release')).toBeInTheDocument();
  });

  it('renders three tabs', async () => {
    await renderApp();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('shows first tab as active by default', async () => {
    await renderApp();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveClass('active');
    expect(tabs[1]).not.toHaveClass('active');
  });

  it('switches tabs on click', async () => {
    const user = userEvent.setup();
    await renderApp();
    const tabs = screen.getAllByRole('tab');

    await user.click(tabs[2]);
    expect(tabs[2]).toHaveClass('active');
    expect(tabs[0]).not.toHaveClass('active');
  });

  it('toggles theme on button click', async () => {
    const user = userEvent.setup();
    const { container } = await renderApp();
    const themeBtn = container.querySelector('.btn-icon');

    expect(themeBtn).toBeTruthy();

    await user.click(themeBtn);
    expect(document.body.getAttribute('data-theme')).toBe('dark');

    await user.click(themeBtn);
    expect(document.body.getAttribute('data-theme')).toBe('light');
  });
});
