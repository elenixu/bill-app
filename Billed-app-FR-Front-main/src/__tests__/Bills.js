/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";
import $ from "jquery";

// ✅ Attach fake modal globally
$.fn.modal = jest.fn();

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES_PATH[pathname];
};

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId('icon-window'));
      const windowIcon = screen.getByTestId('icon-window');
      expect(windowIcon).toHaveClass('active-icon');
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I click on the eye icon", () => {
    test("Then the bill modal should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = BillsUI({ data: bills });

      const billsContainer = new Bills({
        document, onNavigate, store: mockStore, localStorage: window.localStorage
      });

      const eyeIcon = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(eyeIcon));

      eyeIcon.addEventListener("click", handleClickIconEye);
      fireEvent.click(eyeIcon);

      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled(); // ✅ check modal was triggered
    });
  });

  describe("When I click on New Bill button", () => {
    test("Then it should navigate to NewBill page", () => {
      document.body.innerHTML = BillsUI({ data: [] });

      const billsContainer = new Bills({
        document, onNavigate, store: null, localStorage: window.localStorage
      });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      const handleClickNewBill = jest.fn(() => billsContainer.handleClickNewBill());
      newBillBtn.addEventListener("click", handleClickNewBill);

      fireEvent.click(newBillBtn);
      expect(handleClickNewBill).toHaveBeenCalled();
    });
  });

  describe("When I fetch bills from the mock API", () => {
    test("Then it should return bills", async () => {
      const billsFetched = await mockStore.bills().list();
      expect(billsFetched.length).toBeGreaterThan(0);
    });

    test("Then it should fail with 404 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          list: jest.fn().mockRejectedValue(new Error("Erreur 404")),
        };
      });

      await expect(mockStore.bills().list()).rejects.toThrow("Erreur 404");
    });

    test("Then it should fail with 500 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          list: jest.fn().mockRejectedValue(new Error("Erreur 500")),
        };
      });

      await expect(mockStore.bills().list()).rejects.toThrow("Erreur 500");
    });
  });
});
