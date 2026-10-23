import React from "react";
import LinksPage from "../src/features/LinksPage.jsx";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
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

describe("protection extensions", () => {
  it("updates local family readiness when a callback plan is agreed", () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Family circle", exact: true }),
    );
    const score = screen.getByRole("progressbar", {
      name: "Family protection setup score",
    });
    expect(score).toHaveAttribute("value", "0");
    fireEvent.click(screen.getByLabelText(/We agreed to end unusual/));
    expect(score).toHaveAttribute("value", "25");
    expect(JSON.parse(localStorage.getItem("kavach:plan")).callbackPlan).toBe(
      true,
    );
  });
  it("checks a pasted link while community data is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Links & QR", exact: true }),
    );
    fireEvent.change(await screen.findByLabelText("Link or QR content"), {
      target: { value: "https://google.com@evil.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Check content/ }));
    expect(screen.getByText("evil.test")).toBeInTheDocument();
    expect(screen.getByText("Misleading address prefix")).toBeInTheDocument();
  });
  it("keeps editorial explainers and practice counts separate from regional data", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "connected",
        reputation: [],
        campaigns: [],
        campaignTotals: { Chennai: 0, India: 0 },
      }),
    });
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Weekly digest", exact: true }),
    );
    expect(
      await screen.findByText(/No reviewed Chennai campaigns/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Practice drafts are excluded/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tablist", { name: "Scam explainers" }),
    ).toBeInTheDocument();
  });
});

it("credits a completed lesson after playback has stopped", async () => {
  vi.useFakeTimers();
  try {
    render(<App />);
    fireEvent.click(
      screen.getByRole("button", { name: "Practice studio", exact: true }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /The delivery at your door/ }),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2600);
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Ask a family question or call back",
        exact: true,
      }),
    );
    expect(
      JSON.parse(localStorage.getItem("kavach:progress"))[0].scenarioId,
    ).toBe("delivery");
    fireEvent.click(
      screen.getByRole("button", { name: "Family circle", exact: true }),
    );
    expect(
      screen.getByRole("progressbar", {
        name: "Family protection setup score",
      }),
    ).toHaveAttribute("value", "25");
  } finally {
    vi.useRealTimers();
  }
});

describe("camera lifecycle", () => {
  const intelligence = { status: "unavailable", reputation: [], campaigns: [] };
  it("explains permission denial and retains image fallback", async () => {
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    try {
      render(<LinksPage intelligence={intelligence} />);
      fireEvent.click(screen.getByRole("button", { name: "Start camera" }));
      expect(
        await screen.findByText(/Camera could not start/),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Upload QR image")).toBeEnabled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("times out stalled permissions and stops a stream granted later", async () => {
    vi.useFakeTimers();
    let resolve;
    const stop = vi.fn();
    const request = vi.fn(() => new Promise((r) => (resolve = r)));
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: request } });
    try {
      render(<LinksPage intelligence={intelligence} />);
      fireEvent.click(screen.getByRole("button", { name: "Start camera" }));
      expect(request.mock.calls[0][0].audio).toBe(false);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(12000);
      });
      expect(screen.getByText(/No camera frames arrived/)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Start camera" }),
      ).toBeEnabled();
      await act(async () => {
        resolve({ getTracks: () => [{ stop }] });
      });
      expect(stop).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
  it("stops a late camera grant after leaving the page", async () => {
    let resolve;
    const stop = vi.fn();
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: () => new Promise((r) => (resolve = r)) },
    });
    try {
      const view = render(<LinksPage intelligence={intelligence} />);
      fireEvent.click(screen.getByRole("button", { name: "Start camera" }));
      view.unmount();
      await act(async () => {
        resolve({ getTracks: () => [{ stop }] });
      });
      expect(stop).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
