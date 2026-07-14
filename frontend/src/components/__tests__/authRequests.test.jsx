import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import CalendarioEventos from '../CalendarioEventos';
import ImportarCSV from '../ImportarCSV';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation((url) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
  );
});

describe('component requests', () => {
  it('envia requisições do calendário com credentials include', async () => {
    render(<CalendarioEventos token="session" />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/calendario/eventos'),
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });

  it('envia preview de importação com credentials include', async () => {
    const { container } = render(<ImportarCSV token="session" />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['nome,valor\nTeste,10'], 'teste.csv', { type: 'text/csv' });

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    const form = container.querySelector('form');
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
      fireEvent.submit(form);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/importar/csv/preview'),
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });
});
