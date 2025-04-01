import { render, screen } from "@testing-library/react";
import { RatingSteps } from "../RatingSteps";
import { RatingStep } from "@/hooks/useRatingsFlow";

describe("RatingSteps", () => {
  const mockMoveToNextStep = jest.fn();
  const mockMoveToPreviousStep = jest.fn();
  const mockOnConditionComplete = jest.fn();
  const mockActivity = {
    id: "123",
    name: "Test Activity",
    distance: 5000,
    duration: 1800,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    render(
      <RatingSteps
        currentStep="loading"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    expect(screen.getByText("Buscando tus actividades recientes...")).toBeInTheDocument();
  });

  it("renders home screen", () => {
    render(
      <RatingSteps
        currentStep="home"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if HomeScreen component is rendered
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders effort step with activity", () => {
    render(
      <RatingSteps
        currentStep="effort"
        activity={mockActivity}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if EffortStep component is rendered
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("renders energy step", () => {
    render(
      <RatingSteps
        currentStep="energy"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if EnergyStep component is rendered
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("renders condition step", () => {
    render(
      <RatingSteps
        currentStep="condition"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if ConditionStep component is rendered
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not render effort step without activity", () => {
    render(
      <RatingSteps
        currentStep="effort"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if EffortStep component is not rendered
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("renders with correct section styling", () => {
    render(
      <RatingSteps
        currentStep="home"
        activity={null}
        moveToNextStep={mockMoveToNextStep}
        moveToPreviousStep={mockMoveToPreviousStep}
        onConditionComplete={mockOnConditionComplete}
      />
    );

    // Check if the section has the correct styling classes
    const section = screen.getByRole("region");
    expect(section).toHaveClass(
      "bg-white",
      "shadow-lg",
      "rounded-xl",
      "max-w-md",
      "mx-auto",
      "p-6",
      "sm:p-8",
      "border",
      "border-gray-200"
    );
  });

  it("handles all possible step values", () => {
    const steps: RatingStep[] = ["loading", "home", "effort", "energy", "condition"];
    
    steps.forEach(step => {
      render(
        <RatingSteps
          currentStep={step}
          activity={step === "effort" ? mockActivity : null}
          moveToNextStep={mockMoveToNextStep}
          moveToPreviousStep={mockMoveToPreviousStep}
          onConditionComplete={mockOnConditionComplete}
        />
      );

      // Verify that some content is rendered for each step
      expect(screen.getByRole("region")).toBeInTheDocument();
    });
  });
}); 