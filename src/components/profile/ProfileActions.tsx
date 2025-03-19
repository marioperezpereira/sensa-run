
import { LogOut, RefreshCcw, Bell, BellOff, Trophy } from "lucide-react";
import ResetExperienceButton from "./actions/ResetExperienceButton";
import NotificationControls from "./notifications/NotificationControls";
import LogoutButton from "./actions/LogoutButton";
import PBsButton from "./actions/PBsButton";

interface ProfileActionsProps {
  userId: string | undefined;
  onResetClick: () => void;
}

const ProfileActions = ({ userId, onResetClick }: ProfileActionsProps) => {
  return (
    <div className="space-y-4">
      <PBsButton />
      <ResetExperienceButton onClick={onResetClick} />
      <NotificationControls userId={userId} />
      <LogoutButton />
    </div>
  );
};

export default ProfileActions;
