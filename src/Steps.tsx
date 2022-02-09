import React from "react";
import { Link, RouteComponentProps } from "react-router-dom";

export interface StepsProps extends RouteComponentProps<{ stepId: string }> {}

export const Steps: React.FC<StepsProps> = props => {
  // parse int becasue react router vars can only be strings
  const currentStep = parseInt(props.match.params.stepId, 10);

  const nextStep = () => props.history.push(`/steps/${currentStep + 1}`);
  const lastStep = () => props.history.push(`/steps/${currentStep - 1}`);

  return (
    <div>
      <Link to="/">
        <h3>Go Home</h3>
      </Link>

      <h1>Current Step: {currentStep}</h1>

      {/* Show only for step 1 */}
      {currentStep === 1 && <div>This shows for step 1 only!</div>}

      <br />

      {/* hide last step button if step equals or is less than 1 */}
      {currentStep > 1 && <button onClick={lastStep}>Last Step</button>}

      <button onClick={nextStep}>Next Step</button>
    </div>
  );
};
