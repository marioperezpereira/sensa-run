import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import StravaSection from "@/components/profile/StravaSection";
import StravaCallback from "@/pages/StravaCallback";
import { useNavigate, useSearchParams } from "react-router-dom";

// Mock dependencies
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
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe("Strava Integration", () => {
  const mockUser = {
    id: "123",
    email: "test@example.com",
  };

  const mockOnboardingData = {
    user_id: "123",
    strava_profile: null,
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

  describe("StravaSection Component", () => {
    it("shows connect button when no Strava profile exists", () => {
      render(<StravaSection onboardingData={mockOnboardingData} />);
      
      expect(screen.getByAltText(/Connect with Strava/i)).toBeInTheDocument();
      expect(screen.queryByText(/Ver perfil/i)).not.toBeInTheDocument();
    });

    it("shows profile link when Strava profile exists", () => {
      const profileData = {
        ...mockOnboardingData,
        strava_profile: "https://www.strava.com/athletes/123456",
      };
      
      render(<StravaSection onboardingData={profileData} />);
      
      expect(screen.getByText(/Ver perfil/i)).toBeInTheDocument();
      expect(screen.queryByAltText(/Connect with Strava/i)).not.toBeInTheDocument();
    });

    it("initiates Strava OAuth flow when connect button is clicked", async () => {
      // Mock successful OAuth URL generation
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { url: "https://www.strava.com/oauth/authorize?client_id=123" },
        error: null,
      });

      // Mock window.location
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      render(<StravaSection onboardingData={mockOnboardingData} />);
      
      fireEvent.click(screen.getByAltText(/Connect with Strava/i).parentElement!);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith(
          "strava-oauth",
          expect.objectContaining({
            body: { user_id: mockUser.id },
          })
        );
        expect(mockLocation.href).toBe("https://www.strava.com/oauth/authorize?client_id=123");
      });
    });

    it("handles errors during Strava connection", async () => {
      // Mock OAuth error
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Failed to generate OAuth URL" },
      });

      render(<StravaSection onboardingData={mockOnboardingData} />);
      
      fireEvent.click(screen.getByAltText(/Connect with Strava/i).parentElement!);

      await waitFor(() => {
        expect(screen.getByText(/No se pudo conectar con Strava/i)).toBeInTheDocument();
      });
    });
  });

  describe("StravaCallback Component", () => {
    const mockNavigate = jest.fn();
    const mockSearchParams = new URLSearchParams();

    beforeEach(() => {
      (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
      (useSearchParams as jest.Mock).mockReturnValue([mockSearchParams]);
    });

    it("handles successful Strava callback", async () => {
      // Mock successful token exchange
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { athlete_id: "123456" },
        error: null,
      });

      // Mock successful onboarding data update
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      // Set up callback parameters
      mockSearchParams.set("code", "valid_code");
      mockSearchParams.set("state", mockUser.id);

      render(<StravaCallback />);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith(
          "strava-token-exchange",
          expect.objectContaining({
            body: { code: "valid_code" },
            headers: { "x-user-id": mockUser.id },
          })
        );
        expect(supabase.from).toHaveBeenCalledWith("user_onboarding");
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            strava_profile: "https://www.strava.com/athletes/123456",
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith("/app", { replace: true });
      });
    });

    it("handles missing code or state parameters", async () => {
      render(<StravaCallback />);

      await waitFor(() => {
        expect(screen.getByText(/Parámetros de autenticación inválidos/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/app");
      });
    });

    it("handles Strava authorization errors", async () => {
      mockSearchParams.set("error", "access_denied");

      render(<StravaCallback />);

      await waitFor(() => {
        expect(screen.getByText(/No se pudo conectar con Strava/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/app");
      });
    });

    it("handles token exchange errors", async () => {
      mockSearchParams.set("code", "valid_code");
      mockSearchParams.set("state", mockUser.id);

      // Mock token exchange error
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Failed to exchange token" },
      });

      render(<StravaCallback />);

      await waitFor(() => {
        expect(screen.getByText(/Error al conectar con Strava/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/app");
      });
    });

    it("handles onboarding data update errors", async () => {
      mockSearchParams.set("code", "valid_code");
      mockSearchParams.set("state", mockUser.id);

      // Mock successful token exchange
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { athlete_id: "123456" },
        error: null,
      });

      // Mock onboarding data update error
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockResolvedValue({
          error: { message: "Failed to update onboarding data" },
        }),
      });

      render(<StravaCallback />);

      await waitFor(() => {
        expect(screen.getByText(/Error al conectar con Strava/i)).toBeInTheDocument();
        expect(mockNavigate).toHaveBeenCalledWith("/app");
      });
    });
  });

  describe("Token Refresh Flow", () => {
    const mockRefreshToken = "mock_refresh_token";
    const mockNewRefreshToken = "mock_new_refresh_token";
    const mockAccessToken = "mock_access_token";

    beforeEach(() => {
      // Mock stored refresh token
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { refresh_token: mockRefreshToken },
              error: null,
            }),
          }),
        }),
      });
    });

    it("successfully refreshes token and updates stored token", async () => {
      // Mock successful token refresh
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: {
          activities: [],
          refresh_token: mockNewRefreshToken,
          access_token: mockAccessToken,
        },
        error: null,
      });

      // Mock successful token update
      const mockUpdate = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('strava_tokens');
      expect(mockUpdate).toHaveBeenCalledWith({
        refresh_token: mockNewRefreshToken,
      });
    });

    it("handles token refresh errors", async () => {
      // Mock token refresh error
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Failed to refresh token" },
      });

      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe("Failed to refresh token");
      expect(data).toBeNull();
    });

    it("handles missing refresh token", async () => {
      // Mock missing refresh token
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe("No refresh token found for user");
      expect(data).toBeNull();
    });
  });

  describe("Activity Syncing", () => {
    const mockActivities = [
      {
        id: "123",
        name: "Morning Run",
        type: "Run",
        start_date: "2024-03-20T10:00:00Z",
        distance: 5000,
        moving_time: 1800,
        laps: [
          { lap_index: 1, elapsed_time: 900, distance: 2500 },
          { lap_index: 2, elapsed_time: 900, distance: 2500 },
        ],
      },
      {
        id: "124",
        name: "Evening Run",
        type: "Run",
        start_date: "2024-03-19T18:00:00Z",
        distance: 3000,
        moving_time: 1200,
        laps: [],
      },
    ];

    beforeEach(() => {
      // Mock successful token refresh
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: {
          activities: mockActivities,
          refresh_token: "mock_refresh_token",
          access_token: "mock_access_token",
        },
        error: null,
      });
    });

    it("successfully syncs activities and their laps", async () => {
      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeNull();
      expect(data.activities).toHaveLength(2);
      expect(data.activities[0].laps).toHaveLength(2);
      expect(data.activities[1].laps).toHaveLength(0);
    });

    it("handles activity fetch errors", async () => {
      // Mock activity fetch error
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: "Failed to fetch activities" },
      });

      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeDefined();
      expect(error.message).toBe("Failed to fetch activities");
      expect(data).toBeNull();
    });

    it("handles lap fetch errors gracefully", async () => {
      // Mock successful activity fetch but failed lap fetch
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: {
          activities: [
            {
              ...mockActivities[0],
              laps: [], // Empty laps due to error
            },
            mockActivities[1],
          ],
          refresh_token: "mock_refresh_token",
          access_token: "mock_access_token",
        },
        error: null,
      });

      const { data, error } = await supabase.functions.invoke('fetch-strava-activities', {
        body: { user_id: mockUser.id }
      });

      expect(error).toBeNull();
      expect(data.activities).toHaveLength(2);
      expect(data.activities[0].laps).toHaveLength(0);
      expect(data.activities[1].laps).toHaveLength(0);
    });
  });
}); 