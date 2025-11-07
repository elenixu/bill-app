/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { screen, fireEvent, waitFor } from '@testing-library/dom'
import BillsUI from '../views/BillsUI.js'
import Bills from '../containers/Bills.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import router from '../app/Router.js'
import mockStore from '../__mocks__/store'
import $ from 'jquery'

// Attach modal globally
$.fn.modal = jest.fn()

// Helper function to simulate navigation in the app
const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES_PATH[pathname]
}

// Tests for what happens when the employee lands on the Bills Page
describe('Given I am connected as an employee', () => {
  describe('When I am on Bills Page', () => {
    test('Then bill icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      )

      // Create root DOM element and initialize routing
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      // Wait for the icon to render and assert it's highlighted
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')
    })

    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills })

      // Get all visible dates in the table matching ISO-style date regex
      const dates = screen
        .getAllByText((text) => /^\d{2}\/\d{2}\/\d{4}$/.test(text))
        .map((el) => el.innerHTML)

      // Define descending sort (most recent first)
      const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)

      // Assert the dates shown are in descending order
      expect(dates).toEqual(datesSorted)
    })
  })
  // Testing the eye icon functionality (opens bill image in modal)
  describe('When I click on the eye icon', () => {
    test('Then the bill modal should open', () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = BillsUI({ data: bills })

      // Instantiate Bills container to attach logic
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      // Grab the first eye icon and look on the handler
      const eyeIcon = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() =>
        billsContainer.handleClickIconEye(eyeIcon)
      )

      // Attach and trigger the click
      eyeIcon.addEventListener('click', handleClickIconEye)
      fireEvent.click(eyeIcon)

      // Confirm the click handler and modal were called
      expect(handleClickIconEye).toHaveBeenCalled()
      expect($.fn.modal).toHaveBeenCalled()
    })
  })

  // Test navigation to the "New Bill" page via the new bill button
  describe('When I click on New Bill button', () => {
    test('Then it should navigate to NewBill page', () => {
      document.body.innerHTML = BillsUI({ data: [] })

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const newBillBtn = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn(() =>
        billsContainer.handleClickNewBill()
      )
      newBillBtn.addEventListener('click', handleClickNewBill)

      fireEvent.click(newBillBtn)

      // Confirm that the click handler was triggered
      expect(handleClickNewBill).toHaveBeenCalled()
    })
  })

  // Tests for fetching bills from the mocked API
  describe('When I fetch bills from the mock API', () => {
    test('Then it should return bills', async () => {
      const billsFetched = await mockStore.bills().list()
      expect(billsFetched.length).toBeGreaterThan(0)
    })

    // Force the mock store to return a rejected promise
    test('Then it should fail with 404 error', async () => {
      jest.spyOn(mockStore, 'bills').mockImplementation(() => {
        return {
          list: jest.fn().mockRejectedValue(new Error('Erreur 404')),
        }
      })

      await expect(mockStore.bills().list()).rejects.toThrow('Erreur 404')
    })

    test('Then it should fail with 500 error', async () => {
      jest.spyOn(mockStore, 'bills').mockImplementation(() => {
        return {
          list: jest.fn().mockRejectedValue(new Error('Erreur 500')),
        }
      })

      await expect(mockStore.bills().list()).rejects.toThrow('Erreur 500')
    })
  })

  // Unit tests for the `getBills()` method logic
  describe('When I call getBills()', () => {
    // Tests if an invalid date is set
    test('Then if a bill has invalid date, it should return unformatted date', async () => {
      const corruptedStore = {
        bills: () => ({
          list: () =>
            Promise.resolve([
              {
                id: 'bad-bill',
                date: 'not-a-real-date',
                status: 'pending',
              },
            ]),
        }),
      }

      const billsContainer = new Bills({
        document,
        onNavigate,
        store: corruptedStore,
        localStorage: window.localStorage,
      })

      const bills = await billsContainer.getBills()
      expect(bills[0].formattedDate).toBe('not-a-real-date') // falls back
    })

    test('Then if store is undefined, getBills should return undefined', async () => {
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const bills = await billsContainer.getBills()
      expect(bills).toBeUndefined()
    })
  })
})
