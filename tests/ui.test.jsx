import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { App } from "../src/App.jsx";

describe("caller verification and privacy", () => {
  it("requires independent verification and explicit dismissal permission", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Continue securely/ }));
    const confirm = screen.getByRole("button", { name: /Confirm my check/ });
    expect(confirm).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/I independently checked/));
    expect(confirm).toBeDisabled();
    fireEvent.click(
      screen.getByLabelText(/Dismiss this warning for this session/),
    );
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(screen.getByText("Checked by you")).toBeInTheDocument();
    expect(
      screen.getByText(/does not mark the caller permanently safe/),
    ).toBeInTheDocument();
  });
  it("does not offer dismissal after failed family verification", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /They may be joking/ }));
    fireEvent.click(screen.getByRole("button", { name: /Continue securely/ }));
    fireEvent.click(screen.getByLabelText(/The answer was wrong/));
    expect(screen.queryByText("Checked by you")).not.toBeInTheDocument();
    expect(screen.getByText(/Keep the warning/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Confirm my check/ }),
    ).not.toBeInTheDocument();
  });
  it("rechecks new speech after a warning was dismissed", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Continue securely/ }));
    fireEvent.click(screen.getByLabelText(/I independently checked/));
    fireEvent.click(
      screen.getByLabelText(/Dismiss this warning for this session/),
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm my check/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Return to call guard/ }),
    );
    fireEvent.change(
      screen.getByLabelText(/Type or paste what the caller said/),
      {
        target: {
          value:
            "Transfer money immediately. Do not tell anyone. Stay on the call.",
        },
      },
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Multiple warning signals appeared",
    );
    expect(screen.queryByText("Checked by you")).not.toBeInTheDocument();
  });
  it("poor-quality text produces limited analysis", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Call guard", exact: true }),
    );
    fireEvent.click(screen.getByText("Transcript quality & context"));
    fireEvent.change(
      screen.getByLabelText("Transcript quality", { exact: true }),
      { target: { value: "limited" } },
    );
    expect(screen.getByText("Analysis limited")).toBeInTheDocument();
  });
  it("cannot start a microphone session without affirmative consent", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Call guard", exact: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Use microphone/ }));
    expect(
      screen.getByRole("button", { name: /Start microphone/ }),
    ).toBeDisabled();
    expect(
      screen.getByText(/never silently switch to cloud recognition/),
    ).toBeInTheDocument();
  });
  it("keeps report history free of transcript excerpts", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Reports", exact: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Create draft/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save summary only/ }));
    expect(screen.getByText(/PRACTICE DRAFT/)).toBeInTheDocument();
    expect(localStorage.getItem("kavach:reports")).toBeNull();
    expect(localStorage.getItem("kavach:transcript")).toBeNull();
  });
  it("saves a family question only after device-storage consent and never asks for the answer", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Family circle", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Add a trusted contact/ }),
    );
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText("Their name"), {
      target: { value: "Demo relative" },
    });
    fireEvent.change(dialog.getByLabelText("Saved phone number"), {
      target: { value: "+910000000000" },
    });
    fireEvent.change(dialog.getByLabelText("A question you agreed on"), {
      target: { value: "What game did we play together?" },
    });
    expect(
      dialog.getByRole("button", { name: /Save trusted contact/ }),
    ).toBeDisabled();
    expect(dialog.getByText(/Do not enter the answer/)).toBeInTheDocument();
    fireEvent.click(dialog.getByLabelText(/Save this contact and question/));
    fireEvent.click(
      dialog.getByRole("button", { name: /Save trusted contact/ }),
    );
    const saved = JSON.parse(localStorage.getItem("kavach:contacts"));
    expect(saved[0].question).toBe("What game did we play together?");
    expect(saved[0]).not.toHaveProperty("answer");
  });
});
