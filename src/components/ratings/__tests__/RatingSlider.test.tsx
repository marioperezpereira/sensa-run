import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RatingSlider } from "../RatingSlider";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock the useIsMobile hook
jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: jest.fn(),
}));

describe("RatingSlider", () => {
  const mockOnSubmit = jest.fn();
  const mockOnRatingChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobile as jest.Mock).mockReturnValue(false); // Default to desktop view
  });

  it("renders with default props", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Check if the slider is rendered
    expect(screen.getByRole("slider")).toBeInTheDocument();
    
    // Check if the submit button is rendered
    expect(screen.getByText("Enviar valoración")).toBeInTheDocument();
  });

  it("renders without submit button when showSubmitButton is false", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} showSubmitButton={false} />);
    
    // Check if the submit button is not rendered
    expect(screen.queryByText("Enviar valoración")).not.toBeInTheDocument();
  });

  it("calls onSubmit with the selected rating when submit button is clicked", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Get the slider and set a value
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "5" } });
    
    // Click the submit button
    fireEvent.click(screen.getByText("Enviar valoración"));
    
    // Check if onSubmit was called with the correct value
    expect(mockOnSubmit).toHaveBeenCalledWith(5);
  });

  it("calls onRatingChange when the slider value changes", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} onRatingChange={mockOnRatingChange} />);
    
    // Get the slider and change its value
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "5" } });
    
    // Check if onRatingChange was called
    expect(mockOnRatingChange).toHaveBeenCalled();
  });

  it("displays the correct effort description for the selected rating", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Get the slider and set a value
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "5" } });
    
    // Check if the correct description is displayed
    expect(screen.getByText("Pesado")).toBeInTheDocument();
  });

  it("applies the correct color class based on the rating", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Get the rating display element
    const ratingDisplay = screen.getByText("1");
    
    // Check if it has the correct color class for rating 1
    expect(ratingDisplay).toHaveClass("bg-blue-100", "text-blue-700");
  });

  it("renders hover card for desktop view", () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Check if the hover card trigger is rendered
    expect(screen.getByText("Escala de esfuerzo")).toBeInTheDocument();
  });

  it("renders dialog for mobile view", () => {
    (useIsMobile as jest.Mock).mockReturnValue(true);
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Check if the dialog trigger is rendered
    expect(screen.getByText("Escala de esfuerzo")).toBeInTheDocument();
  });

  it("displays all effort descriptions in the info content", async () => {
    render(<RatingSlider onSubmit={mockOnSubmit} />);
    
    // Click the info button
    fireEvent.click(screen.getByText("Escala de esfuerzo"));
    
    // Wait for the content to be displayed
    await waitFor(() => {
      // Check if all effort descriptions are displayed
      expect(screen.getByText("Muy, muy ligero")).toBeInTheDocument();
      expect(screen.getByText("Muy pesado")).toBeInTheDocument();
      expect(screen.getByText("Extremo")).toBeInTheDocument();
    });
  });
}); 