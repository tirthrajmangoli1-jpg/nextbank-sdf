import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AccountCard } from '../components/bank/AccountCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { LoginPage } from '../pages/LoginPage';
import { Account } from '../types';

const mockAccount: Account = {
  id: 'acc_test_01',
  userId: 'usr_01',
  accountNumber: '10029384756',
  maskedAccountNumber: '•••• •••• 4756',
  accountType: 'SAVINGS',
  ifscCode: 'NEXT0001001',
  branch: 'Bandra West, Mumbai',
  balancePaise: 24585050,
  currency: 'INR',
  status: 'ACTIVE',
  openedAt: '2024-01-15T10:00:00.000Z',
  lastUpdated: '2026-11-26T18:30:00.000Z',
};

describe('NextBank UI Component Suite', () => {
  describe('Button Component', () => {
    it('renders text and handles clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Transfer Money</Button>);

      const btn = screen.getByRole('button', { name: /transfer money/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when isLoading is true', () => {
      render(<Button isLoading>Processing</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
    });
  });

  describe('Badge Component', () => {
    it('renders with appropriate status variant', () => {
      render(<Badge variant="success">ACTIVE</Badge>);
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  describe('AccountCard Component', () => {
    it('masks account number by default and reveals on toggle click', () => {
      render(<AccountCard account={mockAccount} />);

      // Masked number should be visible initially
      expect(screen.getByText('•••• •••• 4756')).toBeInTheDocument();

      // Click the reveal toggle button
      const revealBtn = screen.getByRole('button', { name: /reveal account number/i });
      fireEvent.click(revealBtn);

      // Full account number should now be visible
      expect(screen.getByText('10029384756')).toBeInTheDocument();

      // Click to hide again
      const hideBtn = screen.getByRole('button', { name: /hide account number/i });
      fireEvent.click(hideBtn);
      expect(screen.getByText('•••• •••• 4756')).toBeInTheDocument();
    });

    it('formats and displays the Indian Rupee balance', () => {
      render(<AccountCard account={mockAccount} />);
      // 24585050 paise = ₹2,45,850.50
      expect(screen.getByText(/₹2,45,850.50/)).toBeInTheDocument();
    });
  });

  describe('Modal Component', () => {
    it('renders dialog when isOpen is true and dismisses on Escape', () => {
      const handleClose = vi.fn();
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="Closed Modal">
          <p>Hidden</p>
        </Modal>
      );

      expect(screen.queryByText('Closed Modal')).not.toBeInTheDocument();
    });
  });

  describe('LoginPage Component', () => {
    it('renders login form with demo account shortcut button', () => {
      render(
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <LoginPage />
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      );

      expect(screen.getByRole('heading', { name: /sign in to nextbank/i })).toBeInTheDocument();
      const demoBtn = screen.getByRole('button', { name: /use demo account/i });
      expect(demoBtn).toBeInTheDocument();

      // Click "Use Demo Account" and verify fields are populated
      fireEvent.click(demoBtn);
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.value).toBe('demo@novabank.com');
    });
  });
});
