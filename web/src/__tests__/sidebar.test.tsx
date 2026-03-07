import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js modules
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  }),
}));

import Sidebar from '@/components/Sidebar';

describe('Sidebar', () => {
  test('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toBeInTheDocument();
    expect(screen.getByText('Timesheets')).toBeInTheDocument();
    expect(screen.getByText('Leave')).toBeInTheDocument();
    expect(screen.getByText('Employees')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  test('renders app title', () => {
    render(<Sidebar />);
    expect(screen.getByText("Joy-Per's Hub")).toBeInTheDocument();
  });

  test('renders sign out button', () => {
    render(<Sidebar />);
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  test('has navigation role and aria labels', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBeInTheDocument();
  });

  test('marks active page with aria-current', () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');

    const scheduleLink = screen.getByText('Schedule').closest('a');
    expect(scheduleLink).not.toHaveAttribute('aria-current');
  });

  test('all nav links have correct hrefs', () => {
    render(<Sidebar />);
    const expectedLinks = [
      '/dashboard', '/schedule', '/timesheets',
      '/leave', '/employees', '/manual',
    ];

    expectedLinks.forEach((href) => {
      const link = screen.getByRole('link', { name: new RegExp(href.slice(1), 'i') });
      expect(link).toHaveAttribute('href', href);
    });
  });

  test('sign out button has aria-label', () => {
    render(<Sidebar />);
    const signOutButton = screen.getByRole('button', { name: 'Sign out of dashboard' });
    expect(signOutButton).toBeInTheDocument();
  });
});
