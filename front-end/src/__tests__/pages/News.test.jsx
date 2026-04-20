import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import News from '../../pages/News'

// Mock useLanguage hook
vi.mock('../../hooks/useLanguage.jsx', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    setLanguage: vi.fn(),
  })
}))

// Mock translations
vi.mock('../../translations/index', () => ({
  t: (key) => key
}))

// Mock fetch
global.fetch = vi.fn()

describe('News Component', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('renders news page title', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ important: [], others: [] })
    })

    render(<News />)

    expect(screen.getByText('news.title')).toBeInTheDocument()
  })

  it('fetches and displays news on mount', async () => {
    const mockNews = {
      important: [
        {
          id: '1',
          title: 'Test Important News',
          summary: 'Test summary',
          source: 'TestSource',
          published_at: 1704067200,
          symbols: ['BTC'],
          sentiment: 'positive',
          impact_level: 'high',
          category: 'crypto'
        }
      ],
      others: [
        {
          id: '2',
          title: 'Test Other News',
          source: 'TestSource',
          published_at: 1704067200,
          symbols: [],
          sentiment: 'neutral',
          impact_level: 'low',
          category: 'market_indices'
        }
      ]
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockNews
    })

    render(<News />)

    await waitFor(() => {
      expect(screen.getByText('Test Important News')).toBeInTheDocument()
      expect(screen.getByText('Test Other News')).toBeInTheDocument()
    })
  })

  it('filters news by category', async () => {
    const mockNews = {
      important: [],
      others: []
    }

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockNews
    })

    const user = userEvent.setup()
    render(<News />)

    const categorySelect = await screen.findByDisplayValue('news.allCategories')
    await user.selectOptions(categorySelect, 'crypto')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=crypto'),
        expect.anything()
      )
    })
  })

  it('searches news by keyword', async () => {
    const mockNews = {
      important: [],
      others: []
    }

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockNews
    })

    const user = userEvent.setup()
    render(<News />)

    const searchInput = await screen.findByPlaceholderText('news.searchPlaceholder')
    await user.type(searchInput, 'Bitcoin')

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Bitcoin'),
        expect.anything()
      )
    }, { timeout: 2000 })
  })

  it('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'))

    render(<News />)

    // Should not crash, should show empty state or error message
    await waitFor(() => {
      expect(screen.queryByText('news.loading')).not.toBeInTheDocument()
    })
  })

  it('displays correct news counts', async () => {
    const mockNews = {
      important: [{ id: '1', title: 'Test 1', summary: 'Sum', published_at: 123 }],
      others: [
        { id: '2', title: 'Test 2', published_at: 124 },
        { id: '3', title: 'Test 3', published_at: 125 }
      ]
    }

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockNews
    })

    render(<News />)

    await waitFor(() => {
      // Should show counts somewhere in the UI
      expect(screen.getByText(/1/)).toBeInTheDocument()
      expect(screen.getByText(/2/)).toBeInTheDocument()
    })
  })
})
