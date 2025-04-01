import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingQuestion } from "../../OnboardingQuestion";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock all dependencies
jest.mock("@/hooks/use-mobile");
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("Onboarding Flow Integration", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobile as jest.Mock).mockReturnValue(false);
    
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  it("completes the full onboarding flow successfully", async () => {
    // Mock successful signup
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock successful profile creation
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: "123",
          name: "Test User",
          gender: "male",
          birth_date: "1990-01-01",
          weight: 70,
          height: 180,
        },
      }),
    });

    render(<OnboardingQuestion onComplete={() => {}} />);

    // Step 1: Welcome Screen
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));

    // Step 2: Registration
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
    
    // Fill registration form
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Step 3: Personal Info
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    });

    // Fill personal info form
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Género/i), {
      target: { value: "male" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Step 4: Physical Info
    await waitFor(() => {
      expect(screen.getByLabelText(/Peso/i)).toBeInTheDocument();
    });

    // Fill physical info form
    fireEvent.change(screen.getByLabelText(/Peso/i), {
      target: { value: "70" },
    });
    fireEvent.change(screen.getByLabelText(/Altura/i), {
      target: { value: "180" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Step 5: Goals
    await waitFor(() => {
      expect(screen.getByText(/Objetivos/i)).toBeInTheDocument();
    });

    // Select goals
    fireEvent.click(screen.getByText(/Mejorar rendimiento/i));
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify completion
    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido a Sensa Run!/i)).toBeInTheDocument();
    });
  });

  it("handles registration errors", async () => {
    // Mock registration error
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "Email already registered" },
    });

    render(<OnboardingQuestion onComplete={() => {}} />);

    // Start registration
    fireEvent.click(screen.getByRole("button"));

    // Fill registration form
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "existing@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
    });
  });

  it("handles mobile view correctly", async () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    render(<OnboardingQuestion onComplete={() => {}} />);

    // Start flow
    fireEvent.click(screen.getByRole("button"));

    // Check for mobile-specific UI elements
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    // Verify mobile-specific styling
    const form = screen.getByRole("form");
    expect(form).toHaveClass("w-full");
  });

  it("validates form inputs", async () => {
    render(<OnboardingQuestion onComplete={() => {}} />);

    // Start registration
    fireEvent.click(screen.getByRole("button"));

    // Try to submit without filling required fields
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify validation messages
    await waitFor(() => {
      expect(screen.getByText(/Email es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/Contraseña es requerida/i)).toBeInTheDocument();
    });

    // Fill with invalid email
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify email validation
    await waitFor(() => {
      expect(screen.getByText(/Email inválido/i)).toBeInTheDocument();
    });
  });

  it("handles profile creation errors", async () => {
    // Mock successful signup but failed profile creation
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      }),
    });

    render(<OnboardingQuestion onComplete={() => {}} />);

    // Complete registration
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Fill personal info
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Nombre/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/Género/i), {
      target: { value: "male" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument();
    });
  });

  it("handles navigation between steps", async () => {
    render(<OnboardingQuestion onComplete={() => {}} />);

    // Start flow
    fireEvent.click(screen.getByRole("button"));

    // Go to registration
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    // Go back to welcome
    fireEvent.click(screen.getByText(/Atrás/i));
    expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();

    // Go forward again
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });
  });

  it("handles Strava integration successfully", async () => {
    // Mock successful onboarding data save
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(<OnboardingQuestion onComplete={() => {}} />);

    // Complete previous steps
    fireEvent.click(screen.getByRole("button")); // Welcome -> Experience
    fireEvent.click(screen.getByText(/Continuar/i)); // Experience -> Frequency
    fireEvent.click(screen.getByText(/Continuar/i)); // Frequency -> Goal
    fireEvent.click(screen.getByText(/Continuar/i)); // Goal -> Strava

    // Verify Strava step is shown
    await waitFor(() => {
      expect(screen.getByText(/Conecta tu cuenta de Strava/i)).toBeInTheDocument();
    });

    // Test valid Strava URL
    const stravaInput = screen.getByPlaceholderText(/URL de tu perfil de Strava/i);
    fireEvent.change(stravaInput, {
      target: { value: "https://www.strava.com/athletes/123456" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify data was saved
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("user_onboarding");
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          strava_profile: "https://www.strava.com/athletes/123456",
        })
      );
    });
  });

  it("handles Strava URL validation", async () => {
    render(<OnboardingQuestion onComplete={() => {}} />);

    // Complete previous steps
    fireEvent.click(screen.getByRole("button")); // Welcome -> Experience
    fireEvent.click(screen.getByText(/Continuar/i)); // Experience -> Frequency
    fireEvent.click(screen.getByText(/Continuar/i)); // Frequency -> Goal
    fireEvent.click(screen.getByText(/Continuar/i)); // Goal -> Strava

    // Test invalid Strava URL
    const stravaInput = screen.getByPlaceholderText(/URL de tu perfil de Strava/i);
    fireEvent.change(stravaInput, {
      target: { value: "https://invalid-url.com" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify validation message
    await waitFor(() => {
      expect(screen.getByText(/URL de Strava inválida/i)).toBeInTheDocument();
    });

    // Test empty Strava URL (should be allowed)
    fireEvent.change(stravaInput, {
      target: { value: "" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify no validation message
    await waitFor(() => {
      expect(screen.queryByText(/URL de Strava inválida/i)).not.toBeInTheDocument();
    });
  });

  it("persists onboarding data correctly", async () => {
    const mockOnboardingData = {
      running_experience: "Principiante",
      weekly_frequency: "3-4 veces",
      goal_type: "Quiero preparar una carrera lo mejor posible",
      race_distance: "10K",
      race_date: "2024-12-31",
      race_type: "Asfalto",
      additional_info: "Test info",
      strava_profile: "https://www.strava.com/athletes/123456",
    };

    // Mock successful data persistence
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockOnboardingData,
      }),
    });

    render(<OnboardingQuestion onComplete={() => {}} />);

    // Fill out all steps
    fireEvent.click(screen.getByRole("button")); // Welcome -> Experience
    fireEvent.click(screen.getByText(/Principiante/i));
    fireEvent.click(screen.getByText(/Continuar/i));

    fireEvent.click(screen.getByText(/3-4 veces/i));
    fireEvent.click(screen.getByText(/Continuar/i));

    fireEvent.click(screen.getByText(/Quiero preparar una carrera/i));
    fireEvent.click(screen.getByText(/Continuar/i));

    fireEvent.click(screen.getByText(/10K/i));
    fireEvent.click(screen.getByText(/Continuar/i));

    const dateInput = screen.getByLabelText(/Fecha de la carrera/i);
    fireEvent.change(dateInput, {
      target: { value: "2024-12-31" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    const infoInput = screen.getByLabelText(/Información adicional/i);
    fireEvent.change(infoInput, {
      target: { value: "Test info" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    const stravaInput = screen.getByPlaceholderText(/URL de tu perfil de Strava/i);
    fireEvent.change(stravaInput, {
      target: { value: "https://www.strava.com/athletes/123456" },
    });
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify data was saved correctly
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("user_onboarding");
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          ...mockOnboardingData,
        })
      );
    });
  });

  it("handles onboarding data persistence errors", async () => {
    // Mock database error
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to save onboarding data" },
      }),
    });

    render(<OnboardingQuestion onComplete={(() => {}) as () => void} />);

    // Complete the flow
    fireEvent.click(screen.getByRole("button")); // Welcome -> Experience
    fireEvent.click(screen.getByText(/Continuar/i)); // Experience -> Frequency
    fireEvent.click(screen.getByText(/Continuar/i)); // Frequency -> Goal
    fireEvent.click(screen.getByText(/Continuar/i)); // Goal -> Strava

    // Try to save data
    fireEvent.click(screen.getByText(/Continuar/i));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save onboarding data/i)).toBeInTheDocument();
    });
  });

  it("allows skipping Strava integration", async () => {
    render(<OnboardingQuestion onComplete={(() => {}) as () => void} />);

    // Complete previous steps
    fireEvent.click(screen.getByRole("button")); // Welcome -> Experience
    fireEvent.click(screen.getByText(/Continuar/i)); // Experience -> Frequency
    fireEvent.click(screen.getByText(/Continuar/i)); // Frequency -> Goal
    fireEvent.click(screen.getByText(/Continuar/i)); // Goal -> Strava

    // Skip Strava integration
    fireEvent.click(screen.getByText(/Saltar/i));

    // Verify onboarding completes
    await waitFor(() => {
      expect(screen.getByText(/¡Bienvenido a Sensa Run!/i)).toBeInTheDocument();
    });
  });
}); 