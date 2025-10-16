/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES_PATH[pathname];
};

describe("Given I am connected as an Employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({
      type: "Employee",
      email: "employee@test.com"
    }));
    document.body.innerHTML = NewBillUI();
  });

  describe("When I upload a file", () => {
    test("Then uploading an invalid file type should not allow file upload", () => {
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const fileInput = screen.getByTestId("file");
      const invalidFile = new File(["test"], "test.pdf", { type: "application/pdf" });

      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(newBill.fileUrl).toBeNull();
    });

    test("Then uploading a valid file type should update fileUrl", async () => {
  const mockCreate = jest.fn().mockResolvedValue({
    fileUrl: "https://localhost/test.png",
    key: "123"
  });

  jest.spyOn(mockStore, "bills").mockImplementation(() => {
    return { create: mockCreate };
  });

  const newBill = new NewBill({
    document,
    onNavigate,
    store: mockStore,
    localStorage: window.localStorage
  });

  const file = new File(["img"], "test.png", { type: "image/png" });

  // Call handleChangeFile directly with a fake event
  await newBill.handleChangeFile({
    preventDefault: jest.fn(),
    target: { files: [file] }
  });

  // Ensure mockCreate was called
  expect(mockCreate).toHaveBeenCalled();

  // Validate side effects
  expect(newBill.fileName).toBe("test.png");
  expect(newBill.fileUrl).toBe("https://localhost/test.png");
});

  });

  describe("When I submit the form", () => {
    test("Then updateBill should be called and navigate to Bills page", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          update: jest.fn().mockResolvedValue({}),
        };
      });

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe("When I submit to the mock API", () => {
    test("Then it should create a bill successfully", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          update: jest.fn().mockResolvedValue({}),
        };
      });

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      await expect(newBill.updateBill({
        id: "123",
        fileUrl: "https://localhost/test.png",
        fileName: "test.png",
        status: "pending"
      })).resolves.toEqual({});
    });

    test("Then it should fail with 404 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          update: jest.fn().mockRejectedValue(new Error("Erreur 404")),
        };
      });

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      await expect(newBill.updateBill({})).rejects.toThrow("Erreur 404");
    });

    test("Then it should fail with 500 error", async () => {
      jest.spyOn(mockStore, "bills").mockImplementation(() => {
        return {
          update: jest.fn().mockRejectedValue(new Error("Erreur 500")),
        };
      });

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      await expect(newBill.updateBill({})).rejects.toThrow("Erreur 500");
    });
  });
});
