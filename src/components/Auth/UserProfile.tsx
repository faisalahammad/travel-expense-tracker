import { Avatar, Box, Divider, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { User } from "../../types";
import { supabase } from "../../utils/supabase";

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      handleClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        variant="body1"
        sx={{
          color: "white",
          mr: 1,
          display: { xs: "none", sm: "block" },
        }}
      >
        {user.name}
      </Typography>

      <IconButton onClick={handleClick} size="small" aria-controls={open ? "user-menu" : undefined} aria-haspopup="true" aria-expanded={open ? "true" : undefined} sx={{ p: 0 }}>
        {user.avatarUrl ? (
          <Avatar
            src={user.avatarUrl}
            alt={user.name}
            sx={{
              width: 40,
              height: 40,
              border: "2px solid white",
            }}
          />
        ) : (
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "secondary.main",
              border: "2px solid white",
            }}
          >
            {getInitials(user.name)}
          </Avatar>
        )}
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "user-button",
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            mt: 1,
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
      </Menu>
    </Box>
  );
};

export default UserProfile;
