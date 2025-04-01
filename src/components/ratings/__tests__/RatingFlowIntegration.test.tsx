import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RatingFlow } from "../../RatingFlow";
import { useRatingsFlow } from "@/hooks/useRatingsFlow";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock all dependencies
jest.mock("@/hooks/useRatingsFlow");
jest.mock("@/hooks/use-mobile");
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

describe("Rating Flow Integration", () => {
  const mockActivity = {
    id: "123",
    name: "Test Activity",
    distance: 5000,
    duration: 1800,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobile as jest.Mock).mockReturnValue(false);
    
    // Mock initial state
    (useRatingsFlow as jest.Mock).mockReturnValue({
      currentStep: "home",
      activity: mockActivity,
      moveToNextStep: jest.fn(),
      moveToPreviousStep: jest.fn(),
    });

    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: "123" } },
    });
  });

  it("completes the full rating flow successfully", async () => {
    // Mock recommendation generation
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {
        recommendation: "Test recommendation",
        hasFeedback: false,
      },
    });

    render(<RatingFlow />);

    // Step 1: Home Screen
    expect(screen.getByRole("button")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));

    // Step 2: Effort Rating
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    const effortSlider = screen.getByRole("slider");
    fireEvent.change(effortSlider, { target: { value: "5" } });
    fireEvent.click(screen.getByText("Enviar valoración"));

    // Step 3: Energy Rating
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    const energySlider = screen.getByRole("slider");
    fireEvent.change(energySlider, { target: { value: "7" } });
    fireEvent.click(screen.getByText("Enviar valoración"));

    // Step 4: Condition Selection
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button"));

    // Verify recommendation is displayed
    await waitFor(() => {
      expect(screen.getByText("Test recommendation")).toBeInTheDocument();
    });
  });

  it("handles navigation between steps", async () => {
    render(<RatingFlow />);

    // Start from home
    expect(screen.getByRole("button")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));

    // Go to effort rating
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    // Go back to home
    fireEvent.click(screen.getByText("Atrás"));
    expect(screen.getByRole("button")).toBeInTheDocument();

    // Go forward again
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
  });

  it("handles mobile view correctly", async () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    render(<RatingFlow />);

    // Start flow
    fireEvent.click(screen.getByRole("button"));

    // Check for mobile-specific UI elements
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });

    // Verify dialog is used instead of hover card
    fireEvent.click(screen.getByText("Escala de esfuerzo"));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("handles error states and recovery", async () => {
    // Mock error in recommendation generation
    (supabase.functions.invoke as jest.Mock).mockRejectedValue(new Error("Test error"));

    render(<RatingFlow />);

    // Complete the flow until condition selection
    fireEvent.click(screen.getByRole("button")); // Home -> Effort
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Enviar valoración")); // Effort -> Energy

    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Enviar valoración")); // Energy -> Condition

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button")); // Condition -> Recommendation

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Error generating recommendation/i)).toBeInTheDocument();
    });

    // Retry with success
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {
        recommendation: "Test recommendation",
        hasFeedback: false,
      },
    });

    fireEvent.click(screen.getByText("Reintentar"));
    await waitFor(() => {
      expect(screen.getByText("Test recommendation")).toBeInTheDocument();
    });
  });

  it("loads existing recommendation if available", async () => {
    // Mock existing recommendation
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        recommendation: "Existing recommendation",
        feedback: false,
      }),
    });

    render(<RatingFlow />);

    // Verify we skip directly to recommendation
    await waitFor(() => {
      expect(screen.getByText("Existing recommendation")).toBeInTheDocument();
    });
  });

  it("handles feedback submission", async () => {
    // Mock successful recommendation generation
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {
        recommendation: "Test recommendation",
        hasFeedback: true,
      },
    });

    render(<RatingFlow />);

    // Complete the flow
    fireEvent.click(screen.getByRole("button")); // Home -> Effort
    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Enviar valoración")); // Effort -> Energy

    await waitFor(() => {
      expect(screen.getByRole("slider")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Enviar valoración")); // Energy -> Condition

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button")); // Condition -> Recommendation

    // Submit feedback
    await waitFor(() => {
      expect(screen.getByText("Test recommendation")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("👍"));
    
    // Verify feedback is submitted
    await waitFor(() => {
      expect(screen.getByText(/¡Gracias por tu feedback!/i)).toBeInTheDocument();
    });
  });
}); 