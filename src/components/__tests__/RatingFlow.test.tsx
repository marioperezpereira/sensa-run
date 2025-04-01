import { render, screen, waitFor } from "@testing-library/react";
import { RatingFlow } from "../RatingFlow";
import { useRatingsFlow } from "@/hooks/useRatingsFlow";
import { supabase } from "@/integrations/supabase/client";

// Mock the hooks and dependencies
jest.mock("@/hooks/useRatingsFlow");
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("RatingFlow", () => {
  const mockMoveToNextStep = jest.fn();
  const mockMoveToPreviousStep = jest.fn();
  const mockActivity = {
    id: "123",
    name: "Test Activity",
    distance: 5000,
    duration: 1800,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRatingsFlow as jest.Mock).mockReturnValue({
      currentStep: "home",
      activity: mockActivity,
      moveToNextStep: mockMoveToNextStep,
      moveToPreviousStep: mockMoveToPreviousStep,
    });
  });

  it("renders loading state initially", () => {
    render(<RatingFlow />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders RatingSteps component", () => {
    render(<RatingFlow />);
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("checks for existing recommendation on mount", async () => {
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    // Mock existing recommendation
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        recommendation: "Test recommendation",
        feedback: false,
      }),
    });

    render(<RatingFlow />);

    await waitFor(() => {
      expect(mockMoveToNextStep).toHaveBeenCalledTimes(4); // Skip all steps
    });
  });

  it("handles error when checking for existing recommendation", async () => {
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    // Mock error
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockRejectedValue(new Error("Test error")),
    });

    render(<RatingFlow />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading recommendation/i)).toBeInTheDocument();
    });
  });

  it("handles condition completion and recommendation generation", async () => {
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    // Mock energy rating
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        energy_level: 5,
      }),
    });

    // Mock recommendation generation
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {
        recommendation: "Test recommendation",
        hasFeedback: false,
      },
    });

    render(<RatingFlow />);

    // Simulate condition completion
    const conditionStep = screen.getByRole("button");
    conditionStep.click();

    await waitFor(() => {
      expect(screen.getByText("Test recommendation")).toBeInTheDocument();
    });
  });

  it("handles error during recommendation generation", async () => {
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "123" } },
    });

    // Mock energy rating
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        energy_level: 5,
      }),
    });

    // Mock error
    (supabase.functions.invoke as jest.Mock).mockRejectedValue(new Error("Test error"));

    render(<RatingFlow />);

    // Simulate condition completion
    const conditionStep = screen.getByRole("button");
    conditionStep.click();

    await waitFor(() => {
      expect(screen.getByText(/Error generating recommendation/i)).toBeInTheDocument();
    });
  });

  it("renders recommendation display when completed", () => {
    (useRatingsFlow as jest.Mock).mockReturnValue({
      currentStep: "completed",
      activity: mockActivity,
      moveToNextStep: mockMoveToNextStep,
      moveToPreviousStep: mockMoveToPreviousStep,
    });

    render(<RatingFlow />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });
}); 