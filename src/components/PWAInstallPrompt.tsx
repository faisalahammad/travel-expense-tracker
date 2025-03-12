import { Add as AddIcon, Devices as DevicesIcon, Speed as SpeedIcon, Update as UpdateIcon, Wifi as WifiIcon } from "@mui/icons-material";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, ListItemText, Snackbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if the device is iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt event (for non-iOS devices)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for service worker update
    const handleServiceWorkerUpdate = () => {
      setShowUpdateSnackbar(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If using workbox-window, you can listen for updates like this:
    // if ('serviceWorker' in navigator) {
    //   const wb = new Workbox('/sw.js');
    //   wb.addEventListener('controlling', handleServiceWorkerUpdate);
    //   wb.register();
    // }

    // For vite-plugin-pwa, we can use the provided events
    document.addEventListener("vite-pwa:updated", handleServiceWorkerUpdate);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      document.removeEventListener("vite-pwa:updated", handleServiceWorkerUpdate);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (installPrompt) {
      setShowInstallDialog(true);
    }
  };

  const handleInstallConfirm = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      setInstallPrompt(null);
    }
    setShowInstallDialog(false);
  };

  const handleUpdateClick = () => {
    // Reload the page to apply the update
    window.location.reload();
  };

  // Only show the install button if the app is not already installed
  // and we have an install prompt or it's iOS
  const showInstallButton = (installPrompt || isIOS) && !window.matchMedia("(display-mode: standalone)").matches;

  if (!showInstallButton && !showUpdateSnackbar) {
    return null;
  }

  return (
    <>
      {showInstallButton && (
        <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={handleInstallClick} sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}>
          Install App
        </Button>
      )}

      {/* Confirmation dialog for installation */}
      <Dialog open={showInstallDialog} onClose={() => setShowInstallDialog(false)}>
        <DialogTitle>Install Travel Expense Tracker</DialogTitle>
        <DialogContent>
          <Typography paragraph>Install the Travel Expense Tracker app on your device for a better experience:</Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <DevicesIcon />
              </ListItemIcon>
              <ListItemText primary="Access directly from your home screen" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WifiIcon />
              </ListItemIcon>
              <ListItemText primary="Some features work offline" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SpeedIcon />
              </ListItemIcon>
              <ListItemText primary="Faster loading times" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallDialog(false)}>Cancel</Button>
          <Button onClick={handleInstallConfirm} variant="contained" color="primary">
            Install
          </Button>
        </DialogActions>
      </Dialog>

      {/* iOS installation instructions */}
      <Dialog open={showIOSInstructions} onClose={() => setShowIOSInstructions(false)}>
        <DialogTitle>Install on iOS</DialogTitle>
        <DialogContent>
          <Typography paragraph>To install the Travel Expense Tracker on your iOS device:</Typography>
          <List>
            <ListItem>
              <ListItemText primary="1. Tap the Share button at the bottom of the screen" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Scroll down and tap 'Add to Home Screen'" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Tap 'Add' in the top-right corner" />
            </ListItem>
          </List>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <img src="/ios-install-hint.png" alt="iOS installation steps" style={{ maxWidth: "100%", height: "auto", maxHeight: "200px" }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIOSInstructions(false)} variant="contained" color="primary">
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update notification */}
      <Snackbar open={showUpdateSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" startIcon={<UpdateIcon />} onClick={handleUpdateClick}>
              Update
            </Button>
          }
        >
          A new version is available!
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallPrompt;
