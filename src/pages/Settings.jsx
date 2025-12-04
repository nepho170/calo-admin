import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  ContactMail as ContactIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  HelpOutline as FAQIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  LocalOffer as PromoIcon,
} from "@mui/icons-material";
import {
  getAppSettings,
  updateSetting,
  updateMultipleSettings,
  initializeDefaultSettings,
  getPublicSettings,
  getFAQs,
  addFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
  getPromocodes,
  addPromocode,
  updatePromocode,
  deletePromocode,
  togglePromocodeStatus,
} from "../services/settings";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [previewDialog, setPreviewDialog] = useState({
    open: false,
    title: "",
    content: "",
  });
  const [faqDialog, setFaqDialog] = useState({
    open: false,
    mode: "add", // "add" or "edit"
    faq: null,
  });
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
    category: "General",
  });
  const [promocodeDialog, setPromocodeDialog] = useState({
    open: false,
    mode: "add", // "add" or "edit"
    promocode: null,
  });
  const [newPromocode, setNewPromocode] = useState({
    name: "",
    code: "",
    discountType: "percentage",
    discountValue: "",
    isActive: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Initialize default settings if needed
      await initializeDefaultSettings();

      // Load all settings
      const settingsData = await getAppSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error("Error loading settings:", error);
      showSnackbar("Error loading settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingKey, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [settingKey]: {
        ...prev[settingKey],
        [field]: value,
      },
    }));
  };

  const handleSaveSetting = async (settingKey) => {
    try {
      setSaving(true);
      await updateSetting(settingKey, settings[settingKey]);
      showSnackbar(
        `${settings[settingKey].title} saved successfully`,
        "success"
      );
    } catch (error) {
      console.error(`Error saving ${settingKey}:`, error);
      showSnackbar(`Error saving ${settings[settingKey].title}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllSettings = async () => {
    try {
      setSaving(true);
      await updateMultipleSettings(settings);
      showSnackbar("All settings saved successfully", "success");
    } catch (error) {
      console.error("Error saving all settings:", error);
      showSnackbar("Error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = (title, content) => {
    setPreviewDialog({
      open: true,
      title,
      content,
    });
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // FAQ handler functions
  const handleAddFAQ = async () => {
    try {
      setSaving(true);
      await addFAQ(newFaq.question, newFaq.answer, newFaq.category);
      await loadSettings(); // Reload to get updated FAQ data
      setFaqDialog({ open: false, mode: "add", faq: null });
      setNewFaq({ question: "", answer: "", category: "General" });
      showSnackbar("FAQ added successfully", "success");
    } catch (error) {
      console.error("Error adding FAQ:", error);
      showSnackbar("Error adding FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFAQ = async () => {
    try {
      setSaving(true);
      await updateFAQ(faqDialog.faq.id, newFaq);
      await loadSettings(); // Reload to get updated FAQ data
      setFaqDialog({ open: false, mode: "add", faq: null });
      setNewFaq({ question: "", answer: "", category: "General" });
      showSnackbar("FAQ updated successfully", "success");
    } catch (error) {
      console.error("Error updating FAQ:", error);
      showSnackbar("Error updating FAQ", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        setSaving(true);
        await deleteFAQ(faqId);
        await loadSettings(); // Reload to get updated FAQ data
        showSnackbar("FAQ deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting FAQ:", error);
        showSnackbar("Error deleting FAQ", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleEditFAQ = (faq) => {
    setNewFaq({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    });
    setFaqDialog({ open: true, mode: "edit", faq });
  };

  const handleOpenAddFAQ = () => {
    setNewFaq({ question: "", answer: "", category: "General" });
    setFaqDialog({ open: true, mode: "add", faq: null });
  };

  // Promocode functions
  const handleAddPromocode = async () => {
    try {
      setSaving(true);
      await addPromocode(newPromocode);
      await loadSettings(); // Reload to get updated promocodes data
      setPromocodeDialog({ open: false, mode: "add", promocode: null });
      setNewPromocode({
        name: "",
        code: "",
        discountType: "percentage",
        discountValue: "",
        isActive: true,
      });
      showSnackbar("Promocode added successfully", "success");
    } catch (error) {
      console.error("Error adding promocode:", error);
      showSnackbar("Error adding promocode", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePromocode = async () => {
    try {
      setSaving(true);
      await updatePromocode(promocodeDialog.promocode.id, newPromocode);
      await loadSettings(); // Reload to get updated promocodes data
      setPromocodeDialog({ open: false, mode: "add", promocode: null });
      setNewPromocode({
        name: "",
        code: "",
        discountType: "percentage",
        discountValue: "",
        isActive: true,
      });
      showSnackbar("Promocode updated successfully", "success");
    } catch (error) {
      console.error("Error updating promocode:", error);
      showSnackbar("Error updating promocode", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePromocode = async (promocodeId) => {
    if (window.confirm("Are you sure you want to delete this promocode?")) {
      try {
        setSaving(true);
        await deletePromocode(promocodeId);
        await loadSettings(); // Reload to get updated promocodes data
        showSnackbar("Promocode deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting promocode:", error);
        showSnackbar("Error deleting promocode", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTogglePromocodeStatus = async (promocodeId) => {
    try {
      setSaving(true);
      await togglePromocodeStatus(promocodeId);
      await loadSettings(); // Reload to get updated promocodes data
      showSnackbar("Promocode status updated successfully", "success");
    } catch (error) {
      console.error("Error updating promocode status:", error);
      showSnackbar("Error updating promocode status", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditPromocode = (promocode) => {
    setNewPromocode({
      name: promocode.name,
      code: promocode.code,
      discountType: promocode.discountType,
      discountValue: promocode.discountValue.toString(),
      isActive: promocode.isActive,
    });
    setPromocodeDialog({ open: true, mode: "edit", promocode });
  };

  const handleOpenAddPromocode = () => {
    setNewPromocode({
      name: "",
      code: "",
      discountType: "percentage",
      discountValue: "",
      isActive: true,
    });
    setPromocodeDialog({ open: true, mode: "add", promocode: null });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          <SettingsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          App Settings
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSettings}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAllSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save All"}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          These settings control the content displayed to customers in your
          mobile app. Make sure to save your changes after editing.
        </Typography>
      </Alert>

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SecurityIcon />} label="Legal" />
          <Tab icon={<InfoIcon />} label="About" />
          <Tab icon={<ContactIcon />} label="Contact" />
          <Tab icon={<ShareIcon />} label="Social Media" />
          <Tab icon={<FAQIcon />} label="FAQ" />
          <Tab icon={<PromoIcon />} label="Promocodes" />
        </Tabs>

        {/* Legal Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Terms and Conditions */}
            {settings.termsAndConditions && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">Terms and Conditions</Typography>
                      <Box>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handlePreview(
                                settings.termsAndConditions.title,
                                settings.termsAndConditions.content
                              )
                            }
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Chip
                          label={`v${
                            settings.termsAndConditions.version || "1.0"
                          }`}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.termsAndConditions.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "termsAndConditions",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable Terms and Conditions"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Title"
                      value={settings.termsAndConditions.title || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "termsAndConditions",
                          "title",
                          e.target.value
                        )
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Version"
                      value={settings.termsAndConditions.version || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "termsAndConditions",
                          "version",
                          e.target.value
                        )
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Content"
                      value={settings.termsAndConditions.content || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "termsAndConditions",
                          "content",
                          e.target.value
                        )
                      }
                      placeholder="Enter your terms and conditions here..."
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("termsAndConditions")}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}

            {/* Privacy Policy */}
            {settings.privacyPolicy && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">Privacy Policy</Typography>
                      <Box>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handlePreview(
                                settings.privacyPolicy.title,
                                settings.privacyPolicy.content
                              )
                            }
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Chip
                          label={`v${settings.privacyPolicy.version || "1.0"}`}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.privacyPolicy.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "privacyPolicy",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable Privacy Policy"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Title"
                      value={settings.privacyPolicy.title || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "privacyPolicy",
                          "title",
                          e.target.value
                        )
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Version"
                      value={settings.privacyPolicy.version || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "privacyPolicy",
                          "version",
                          e.target.value
                        )
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      label="Content"
                      value={settings.privacyPolicy.content || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "privacyPolicy",
                          "content",
                          e.target.value
                        )
                      }
                      placeholder="Enter your privacy policy here..."
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("privacyPolicy")}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* About Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {settings.aboutUs && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">About Us</Typography>
                      <Tooltip title="Preview">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handlePreview(
                              settings.aboutUs.title,
                              settings.aboutUs.content
                            )
                          }
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.aboutUs.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "aboutUs",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable About Us Page"
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Title"
                      value={settings.aboutUs.title || ""}
                      onChange={(e) =>
                        handleSettingChange("aboutUs", "title", e.target.value)
                      }
                      sx={{ mb: 2 }}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      label="Content"
                      value={settings.aboutUs.content || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "aboutUs",
                          "content",
                          e.target.value
                        )
                      }
                      placeholder="Tell customers about your company, mission, values, and story..."
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("aboutUs")}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Contact Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {settings.contactInfo && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>
                      Contact Information
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.contactInfo.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "contactInfo",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable Contact Information"
                      sx={{ mb: 3 }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          value={settings.contactInfo.email || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "contactInfo",
                              "email",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={settings.contactInfo.phone || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "contactInfo",
                              "phone",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="WhatsApp Number"
                          value={settings.contactInfo.whatsapp || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "contactInfo",
                              "whatsapp",
                              e.target.value
                            )
                          }
                          placeholder="+1 (555) 123-4567"
                          helperText="Include country code for international customers"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Address"
                          value={settings.contactInfo.address || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "contactInfo",
                              "address",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("contactInfo")}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Social Media Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {settings.socialMedia && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" mb={2}>
                      Social Media Links
                    </Typography>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.socialMedia.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable Social Media Links"
                      sx={{ mb: 3 }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Facebook URL"
                          value={settings.socialMedia.facebook || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "facebook",
                              e.target.value
                            )
                          }
                          placeholder="https://facebook.com/yourpage"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Instagram URL"
                          value={settings.socialMedia.instagram || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "instagram",
                              e.target.value
                            )
                          }
                          placeholder="https://instagram.com/youraccount"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Twitter URL"
                          value={settings.socialMedia.twitter || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "twitter",
                              e.target.value
                            )
                          }
                          placeholder="https://twitter.com/youraccount"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="LinkedIn URL"
                          value={settings.socialMedia.linkedin || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "linkedin",
                              e.target.value
                            )
                          }
                          placeholder="https://linkedin.com/company/yourcompany"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="TikTok URL"
                          value={settings.socialMedia.tiktok || ""}
                          onChange={(e) =>
                            handleSettingChange(
                              "socialMedia",
                              "tiktok",
                              e.target.value
                            )
                          }
                          placeholder="https://tiktok.com/@youraccount"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("socialMedia")}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* FAQ Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            {settings.faq && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography variant="h6">
                        Frequently Asked Questions
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddFAQ}
                        size="small"
                      >
                        Add FAQ
                      </Button>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.faq.enabled || false}
                          onChange={(e) =>
                            handleSettingChange(
                              "faq",
                              "enabled",
                              e.target.checked
                            )
                          }
                        />
                      }
                      label="Enable FAQ Section"
                      sx={{ mb: 3 }}
                    />

                    {/* FAQ Items List */}
                    {settings.faq.items && settings.faq.items.length > 0 ? (
                      <Grid container spacing={2}>
                        {settings.faq.items
                          .sort((a, b) => a.order - b.order)
                          .map((faq) => (
                            <Grid item xs={12} key={faq.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="flex-start"
                                    mb={1}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        gutterBottom
                                      >
                                        Q: {faq.question}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        mb={1}
                                      >
                                        A: {faq.answer}
                                      </Typography>
                                      <Chip
                                        label={faq.category}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </Box>
                                    <Box>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditFAQ(faq)}
                                        sx={{ mr: 1 }}
                                      >
                                        <EditIcon />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteFAQ(faq.id)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                      </Grid>
                    ) : (
                      <Alert severity="info">
                        No FAQ items yet. Click "Add FAQ" to create your first
                        question.
                      </Alert>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSaveSetting("faq")}
                      disabled={saving}
                    >
                      Save FAQ Settings
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Promocodes Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h6">Promocodes Management</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenAddPromocode}
                      size="small"
                    >
                      Add Promocode
                    </Button>
                  </Box>

                  {/* Promocodes List */}
                  {settings.promocodes &&
                  settings.promocodes.codes &&
                  settings.promocodes.codes.length > 0 ? (
                    <Grid container spacing={2}>
                      {settings.promocodes.codes.map((promocode) => (
                        <Grid item xs={12} md={6} key={promocode.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="flex-start"
                                mb={2}
                              >
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    {promocode.name}
                                    <Chip
                                      label={
                                        promocode.isActive
                                          ? "Active"
                                          : "Inactive"
                                      }
                                      size="small"
                                      color={
                                        promocode.isActive ? "success" : "error"
                                      }
                                      variant="outlined"
                                    />
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    color="primary"
                                    fontWeight="bold"
                                    sx={{
                                      fontFamily: "monospace",
                                      fontSize: "1.1rem",
                                      letterSpacing: "0.1em",
                                    }}
                                  >
                                    {promocode.code}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mt={1}
                                  >
                                    Discount:{" "}
                                    {promocode.discountType === "percentage"
                                      ? `${promocode.discountValue}%`
                                      : `$${promocode.discountValue}`}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                    mt={1}
                                  >
                                    Created:{" "}
                                    {new Date(
                                      promocode.createdAt
                                    ).toLocaleDateString()}
                                  </Typography>
                                </Box>
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleTogglePromocodeStatus(promocode.id)
                                    }
                                    sx={{ mr: 1 }}
                                    color={
                                      promocode.isActive ? "warning" : "success"
                                    }
                                    title={
                                      promocode.isActive
                                        ? "Deactivate"
                                        : "Activate"
                                    }
                                  >
                                    <Switch
                                      checked={promocode.isActive}
                                      size="small"
                                    />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleEditPromocode(promocode)
                                    }
                                    sx={{ mr: 1 }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeletePromocode(promocode.id)
                                    }
                                    color="error"
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info">
                      No promocodes yet. Click "Add Promocode" to create your
                      first promocode.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* FAQ Add/Edit Dialog */}
      <Dialog
        open={faqDialog.open}
        onClose={() => setFaqDialog({ open: false, mode: "add", faq: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {faqDialog.mode === "add" ? "Add New FAQ" : "Edit FAQ"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Category"
              value={newFaq.category}
              onChange={(e) =>
                setNewFaq({ ...newFaq, category: e.target.value })
              }
              sx={{ mb: 2 }}
              placeholder="e.g., Orders, Payment, Diet, General"
            />
            <TextField
              fullWidth
              label="Question"
              value={newFaq.question}
              onChange={(e) =>
                setNewFaq({ ...newFaq, question: e.target.value })
              }
              sx={{ mb: 2 }}
              placeholder="Enter the frequently asked question..."
            />
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Answer"
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              placeholder="Enter the answer to this question..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setFaqDialog({ open: false, mode: "add", faq: null })
            }
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={faqDialog.mode === "add" ? handleAddFAQ : handleUpdateFAQ}
            disabled={
              saving ||
              !newFaq.question.trim() ||
              !newFaq.answer.trim() ||
              !newFaq.category.trim()
            }
          >
            {saving
              ? "Saving..."
              : faqDialog.mode === "add"
              ? "Add FAQ"
              : "Update FAQ"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promocode Add/Edit Dialog */}
      <Dialog
        open={promocodeDialog.open}
        onClose={() =>
          setPromocodeDialog({ open: false, mode: "add", promocode: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {promocodeDialog.mode === "add"
            ? "Add New Promocode"
            : "Edit Promocode"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Promocode Name"
              value={newPromocode.name}
              onChange={(e) =>
                setNewPromocode({ ...newPromocode, name: e.target.value })
              }
              sx={{ mb: 2 }}
              placeholder="e.g., Summer Sale, New Customer..."
            />
            <TextField
              fullWidth
              label="Promocode"
              value={newPromocode.code}
              onChange={(e) =>
                setNewPromocode({
                  ...newPromocode,
                  code: e.target.value.toUpperCase(),
                })
              }
              sx={{ mb: 2 }}
              placeholder="e.g., SUMMER2024, WELCOME10..."
              inputProps={{
                style: { fontFamily: "monospace", fontSize: "1.1rem" },
              }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={newPromocode.discountType}
                label="Discount Type"
                onChange={(e) =>
                  setNewPromocode({
                    ...newPromocode,
                    discountType: e.target.value,
                  })
                }
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={`Discount Value ${
                newPromocode.discountType === "percentage" ? "(%)" : "($)"
              }`}
              type="number"
              value={newPromocode.discountValue}
              onChange={(e) =>
                setNewPromocode({
                  ...newPromocode,
                  discountValue: e.target.value,
                })
              }
              sx={{ mb: 2 }}
              placeholder={
                newPromocode.discountType === "percentage"
                  ? "e.g., 10 for 10%"
                  : "e.g., 25 for $25"
              }
              inputProps={{
                min: 0,
                max:
                  newPromocode.discountType === "percentage" ? 100 : undefined,
                step: newPromocode.discountType === "percentage" ? 1 : 0.01,
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newPromocode.isActive}
                  onChange={(e) =>
                    setNewPromocode({
                      ...newPromocode,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active (available for use)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPromocodeDialog({ open: false, mode: "add", promocode: null });
              setNewPromocode({
                name: "",
                code: "",
                discountType: "percentage",
                discountValue: "",
                isActive: true,
              });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={
              promocodeDialog.mode === "add"
                ? handleAddPromocode
                : handleUpdatePromocode
            }
            disabled={
              saving ||
              !newPromocode.name.trim() ||
              !newPromocode.code.trim() ||
              !newPromocode.discountValue ||
              parseFloat(newPromocode.discountValue) <= 0 ||
              (newPromocode.discountType === "percentage" &&
                parseFloat(newPromocode.discountValue) > 100)
            }
          >
            {saving
              ? "Saving..."
              : promocodeDialog.mode === "add"
              ? "Add Promocode"
              : "Update Promocode"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ ...previewDialog, open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{previewDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" style={{ whiteSpace: "pre-wrap" }}>
            {previewDialog.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPreviewDialog({ ...previewDialog, open: false })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
