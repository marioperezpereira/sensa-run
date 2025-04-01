import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import PersonalBests from "@/pages/PersonalBests";
import { useNavigate } from "react-router-dom";

// Mock dependencies
jest.mock("@/hooks/use-mobile");
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

describe("Personal Bests Integration", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
  };

  const mockProfile = {
    id: "profile123",
    user_id: "123",
    gender: "male",
    birth_date: "1990-01-01",
    weight: 70,
    height: 180,
  };

  const mockRaceResult = {
    id: "race123",
    user_id: "123",
    race_date: "2024-01-01",
    distance: "10K",
    hours: 0,
    minutes: 45,
    seconds: 30,
    surface_type: "Asfalto",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobile as jest.Mock).mockReturnValue(false);
    (useNavigate as jest.Mock).mockReturnValue(jest.fn());
    
    // Mock user data
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  it("loads personal bests page and checks profile", async () => {
    // Mock profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
      }),
    });

    render(<PersonalBests />);

    // Verify loading state
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();

    // Wait for profile check
    await waitFor(() => {
      expect(screen.getByText(/Personal Bests/i)).toBeInTheDocument();
    });

    // Verify "Add New Result" button is shown
    expect(screen.getByText(/Nueva marca/i)).toBeInTheDocument();
  });

  it("shows profile form when no profile exists", async () => {
    // Mock no profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
      }),
    });

    render(<PersonalBests />);

    // Wait for profile check
    await waitFor(() => {
      expect(screen.getByText(/Completa tu perfil/i)).toBeInTheDocument();
    });

    // Fill profile form
    fireEvent.change(screen.getByLabelText(/Género/i), {
      target: { value: "male" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/i), {
      target: { value: "1990-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Peso/i), {
      target: { value: "70" },
    });
    fireEvent.change(screen.getByLabelText(/Altura/i), {
      target: { value: "180" },
    });

    // Mock successful profile creation
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    });

    // Submit form
    fireEvent.click(screen.getByText(/Guardar/i));

    // Verify profile was created
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("user_pb_profiles");
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          gender: "male",
          birth_date: "1990-01-01",
          weight: 70,
          height: 180,
        })
      );
    });
  });

  it("adds a new race result", async () => {
    // Mock profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
      }),
      insert: jest.fn().mockResolvedValue({ data: mockRaceResult, error: null }),
    });

    render(<PersonalBests />);

    // Wait for profile check
    await waitFor(() => {
      expect(screen.getByText(/Personal Bests/i)).toBeInTheDocument();
    });

    // Open add result dialog
    fireEvent.click(screen.getByText(/Nueva marca/i));

    // Fill race result form
    await waitFor(() => {
      expect(screen.getByLabelText(/Distancia/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Distancia/i), {
      target: { value: "10K" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Horas/i), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText(/Minutos/i), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByLabelText(/Segundos/i), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText(/Superficie/i), {
      target: { value: "Asfalto" },
    });

    // Submit form
    fireEvent.click(screen.getByText(/Guardar/i));

    // Verify result was saved
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("race_results");
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          distance: "10K",
          race_date: "2024-01-01",
          hours: 0,
          minutes: 45,
          seconds: 30,
          surface_type: "Asfalto",
        })
      );
    });
  });

  it("displays race results grouped by surface type", async () => {
    // Mock profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
      }),
    });

    // Mock race results
    const mockResults = [
      {
        ...mockRaceResult,
        id: "race1",
        distance: "10K",
        surface_type: "Asfalto",
      },
      {
        ...mockRaceResult,
        id: "race2",
        distance: "5K",
        surface_type: "Asfalto",
      },
      {
        ...mockRaceResult,
        id: "race3",
        distance: "1500m",
        surface_type: "Pista de atletismo",
        track_type: "Aire Libre",
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockResults,
        error: null,
      }),
    });

    render(<PersonalBests />);

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText(/Asfalto/i)).toBeInTheDocument();
      expect(screen.getByText(/Pista de Atletismo/i)).toBeInTheDocument();
    });

    // Verify results are displayed correctly
    expect(screen.getByText(/10K/i)).toBeInTheDocument();
    expect(screen.getByText(/5K/i)).toBeInTheDocument();
    expect(screen.getByText(/1500m/i)).toBeInTheDocument();
  });

  it("handles errors when adding race results", async () => {
    // Mock profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
      }),
      insert: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Failed to save race result" },
      }),
    });

    render(<PersonalBests />);

    // Wait for profile check
    await waitFor(() => {
      expect(screen.getByText(/Personal Bests/i)).toBeInTheDocument();
    });

    // Open add result dialog
    fireEvent.click(screen.getByText(/Nueva marca/i));

    // Fill race result form
    await waitFor(() => {
      expect(screen.getByLabelText(/Distancia/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Distancia/i), {
      target: { value: "10K" },
    });
    fireEvent.change(screen.getByLabelText(/Fecha/i), {
      target: { value: "2024-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Horas/i), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText(/Minutos/i), {
      target: { value: "45" },
    });
    fireEvent.change(screen.getByLabelText(/Segundos/i), {
      target: { value: "30" },
    });

    // Submit form
    fireEvent.click(screen.getByText(/Guardar/i));

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to save race result/i)).toBeInTheDocument();
    });
  });

  it("calculates and displays IAAF points correctly", async () => {
    // Mock profile exists
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
      }),
    });

    // Mock race results with good times for IAAF points
    const mockResults = [
      {
        ...mockRaceResult,
        id: "race1",
        distance: "10K",
        hours: 0,
        minutes: 35,
        seconds: 0,
        surface_type: "Asfalto",
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: mockResults,
        error: null,
      }),
    });

    render(<PersonalBests />);

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText(/10K/i)).toBeInTheDocument();
    });

    // Verify IAAF points are displayed
    expect(screen.getByText(/pts/i)).toBeInTheDocument();
  });
}); 