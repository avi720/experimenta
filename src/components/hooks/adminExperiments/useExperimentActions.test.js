import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMock = vi.hoisted(() => vi.fn());
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react", () => ({
  useState: (init) => [init, vi.fn()],
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useContext: () => ({ user: { locale_preference: "he" } }),
}));
vi.mock("@/lib/AuthContext", () => ({
  AuthContext: {},
  useAuth: () => ({ user: { locale_preference: "he" } }),
}));
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock("@/entities/all", () => ({
  ExperimentTemplate: {
    update: updateMock,
    delete: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("sonner", () => ({
  toast: toastMocks,
}));

import { useExperimentActions } from "./useExperimentActions.jsx";

describe("useExperimentActions (T36, T55)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggleActive sends only { is_active } instead of the full row (T55)", async () => {
    updateMock.mockResolvedValueOnce({ id: "exp-1", is_active: false });
    const loadExperiments = vi.fn();
    const { toggleActive } = useExperimentActions(loadExperiments, []);

    await toggleActive({
      id: "exp-1",
      slug: "free-fall",
      is_active: true,
      parameters: [{ key: "h0" }],
      presets: [{ name_he: "ירח" }],
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith("exp-1", { is_active: false });
  });

  it("exportExperiments shows an error toast when filteredExperiments is empty (T36)", () => {
    const { exportExperiments } = useExperimentActions(vi.fn(), []);
    exportExperiments();
    expect(toastMocks.error).toHaveBeenCalledWith("אין ניסויים לייצוא");
  });
});
