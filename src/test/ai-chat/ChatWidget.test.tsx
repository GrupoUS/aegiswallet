// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatWidget } from '../../features/ai-chat/components/ChatWidget';

// Mock ChatContainer to avoid complex setup
vi.mock('../../features/ai-chat/components/ChatContainer', () => ({
	ChatContainer: ({ onClose }: { onClose: () => void }) => (
		<div data-testid="chat-container">
			<button type="button" onClick={onClose} data-testid="close-chat">
				Close
			</button>
		</div>
	),
}));

describe('ChatWidget', () => {
	it('renders closed by default', () => {
		render(<ChatWidget />);
		expect(screen.queryByTestId('chat-container')).not.toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /abrir chat/i }),
		).toBeInTheDocument();
	});

	it('opens when toggle button is clicked', () => {
		render(<ChatWidget />);
		const toggleButton = screen.getByRole('button', { name: /abrir chat/i });

		fireEvent.click(toggleButton);

		expect(screen.getByTestId('chat-container')).toBeInTheDocument();
		expect(
			screen.getByRole('button', { name: /fechar chat/i }),
		).toBeInTheDocument();
	});

	it('closes when close button in container is clicked', () => {
		render(<ChatWidget />);
		const toggleButton = screen.getByRole('button', { name: /abrir chat/i });
		fireEvent.click(toggleButton);

		const closeButton = screen.getByTestId('close-chat');
		fireEvent.click(closeButton);

		expect(screen.queryByTestId('chat-container')).not.toBeInTheDocument();
	});
});
