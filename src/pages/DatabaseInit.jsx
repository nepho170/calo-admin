// import { useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Alert,
//   AlertTitle,
//   LinearProgress,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Chip,
//   Grid,
//   Paper,
//   Stepper,
//   Step,
//   StepLabel,
//   StepContent,
// } from "@mui/material";
// import {
//   CheckCircle as CheckCircleIcon,
//   Error as ErrorIcon,
//   Warning as WarningIcon,
//   Info as InfoIcon,
//   Storage as StorageIcon,
//   PlayArrow as PlayArrowIcon,
//   Refresh as RefreshIcon,
//   RestaurantMenu as RestaurantMenuIcon,
//   LocalOffer as LocalOfferIcon,
//   Fastfood as FastfoodIcon,
//   Timeline as TimelineIcon,
//   Inventory as PackageIcon,
//   CalendarToday as CalendarIcon,
//   BugReport as BugReportIcon,
//   AutoFixHigh as AutoFixHighIcon,
// } from "@mui/icons-material";
// import {
//   initializeDatabase,
//   validateDatabaseStructure,
// } from "../utils/database-init";

// const steps = [
//   {
//     label: "Create Labels",
//     description:
//       "Setting up dietary and health labels (Gluten Free, High Protein, etc.)",
//     icon: <LocalOfferIcon />,
//     color: "primary",
//   },
//   {
//     label: "Add Ingredients",
//     description: "Populating ingredient database with nutritional information",
//     icon: <RestaurantMenuIcon />,
//     color: "secondary",
//   },
//   {
//     label: "Create Meals",
//     description: "Building sample meals with calculated nutrition",
//     icon: <FastfoodIcon />,
//     color: "success",
//   },
//   {
//     label: "Setup Macro Plans",
//     description: "Creating nutrition plans (High Protein, Balanced, Keto)",
//     icon: <TimelineIcon />,
//     color: "info",
//   },
//   {
//     label: "Configure Packages",
//     description: "Setting up meal packages for different needs",
//     icon: <PackageIcon />,
//     color: "warning",
//   },
//   {
//     label: "Generate Menus",
//     description: "Creating weekly menu templates",
//     icon: <CalendarIcon />,
//     color: "error",
//   },
// ];

// export default function DatabaseInit() {
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [isValidating, setIsValidating] = useState(false);
//   const [initProgress, setInitProgress] = useState(-1);
//   const [validationResults, setValidationResults] = useState(null);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [confirmDialog, setConfirmDialog] = useState(false);

//   // Migration state
//   const [isMigrating, setIsMigrating] = useState(false);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [migrationResults, setMigrationResults] = useState(null);
//   const [analysisResults, setAnalysisResults] = useState(null);
//   const [migrationDialog, setMigrationDialog] = useState(false);

//   const handleInitialize = async () => {
//     setConfirmDialog(false);
//     setIsInitializing(true);
//     setError(null);
//     setSuccess(null);
//     setInitProgress(0);

//     try {
//       // Simulate step-by-step progress
//       for (let i = 0; i < steps.length; i++) {
//         setInitProgress(i);
//         await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate work
//       }

//       // Actually initialize the database
//       const result = await initializeDatabase("admin_user_id");
//       setInitProgress(steps.length);

//       setSuccess({
//         message: "Database initialized successfully!",
//         details: result,
//       });

//       // Validate after initialization
//       handleValidate();
//     } catch (err) {
//       setError(err.message || "Failed to initialize database");
//       console.error("Database initialization error:", err);
//     } finally {
//       setIsInitializing(false);
//     }
//   };

//   const handleValidate = async () => {
//     setIsValidating(true);
//     setError(null);

//     try {
//       const results = await validateDatabaseStructure();
//       setValidationResults(results);
//     } catch (err) {
//       setError(err.message || "Failed to validate database structure");
//       console.error("Database validation error:", err);
//     } finally {
//       setIsValidating(false);
//     }
//   };

//   const getStepStatus = (stepIndex) => {
//     if (initProgress < 0) return "pending";
//     if (initProgress > stepIndex) return "completed";
//     if (initProgress === stepIndex) return "active";
//     return "pending";
//   };

//   const getStepIcon = (stepIndex, step) => {
//     const status = getStepStatus(stepIndex);
//     if (status === "completed") return <CheckCircleIcon />;
//     if (status === "active") return step.icon;
//     return step.icon;
//   };

//   const getStepColor = (stepIndex) => {
//     const status = getStepStatus(stepIndex);
//     if (status === "completed") return "success";
//     if (status === "active") return "primary";
//     return "default";
//   };

//   // Migration handlers
//   const handleAnalyzeMigration = async () => {
//     setIsAnalyzing(true);
//     setError(null);

//     try {
//       const results = await analyzeOrdersMigrationNeeds();
//       setAnalysisResults(results);
//     } catch (err) {
//       setError(err.message || "Failed to analyze migration needs");
//       console.error("Migration analysis error:", err);
//     } finally {
//       setIsAnalyzing(false);
//     }
//   };

//   const handleMigration = async () => {
//     setIsMigrating(true);
//     setError(null);
//     setMigrationResults(null);

//     try {
//       const results = await migrateAllOrdersStatuses();
//       setMigrationResults(results);
//       setMigrationDialog(false);

//       // Refresh analysis after migration
//       await handleAnalyzeMigration();
//     } catch (err) {
//       setError(err.message || "Failed to migrate orders");
//       console.error("Migration error:", err);
//     } finally {
//       setIsMigrating(false);
//     }
//   };

//   return (
//     <Box sx={{ flexGrow: 1 }}>
//       <Typography
//         variant="h4"
//         component="h1"
//         gutterBottom
//         sx={{ fontWeight: "bold" }}
//       >
//         Database Initialization
//       </Typography>
//       <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
//         Set up your meal planning database with sample data to get started
//         quickly.
//       </Typography>

//       {error && (
//         <Alert severity="error" sx={{ mb: 3 }}>
//           <AlertTitle>Error</AlertTitle>
//           {error}
//         </Alert>
//       )}

//       {success && (
//         <Alert severity="success" sx={{ mb: 3 }}>
//           <AlertTitle>Success</AlertTitle>
//           {success.message}
//         </Alert>
//       )}

//       <Grid container spacing={3}>
//         {/* Initialization Process */}
//         <Grid container spacing={3} sx={{ margin: 0, width: "100%" }}>
//           <Card sx={{ width: "100%" }}>
//             <CardContent>
//               <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
//                 <StorageIcon sx={{ mr: 2, color: "primary.main" }} />
//                 <Typography
//                   variant="h6"
//                   component="h2"
//                   sx={{ fontWeight: "bold" }}
//                 >
//                   Database Setup Process
//                 </Typography>
//               </Box>
//               <Typography
//                 variant="body2"
//                 color="text.secondary"
//                 sx={{ mb: 3, textAlign: "left" }}
//               >
//                 This will create sample data including ingredients, meals, macro
//                 plans, and weekly menus.
//               </Typography>

//               {/* Progress Bar */}
//               {isInitializing && (
//                 <Box sx={{ mb: 3 }}>
//                   <LinearProgress
//                     variant="determinate"
//                     value={((initProgress + 1) / steps.length) * 100}
//                     sx={{ height: 8, borderRadius: 4 }}
//                   />
//                   <Typography
//                     variant="body2"
//                     sx={{ mt: 1, textAlign: "center" }}
//                   >
//                     {initProgress >= 0 && initProgress < steps.length
//                       ? `${steps[initProgress].label}...`
//                       : "Completing setup..."}
//                   </Typography>
//                 </Box>
//               )}

//               {/* Stepper */}
//               <Stepper orientation="vertical" sx={{ mb: 3 }}>
//                 {steps.map((step, index) => (
//                   <Step
//                     key={index}
//                     active={getStepStatus(index) === "active"}
//                     completed={getStepStatus(index) === "completed"}
//                   >
//                     <StepLabel
//                       StepIconComponent={() => (
//                         <Box
//                           sx={{
//                             display: "flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             width: 32,
//                             height: 32,
//                             borderRadius: "50%",
//                             backgroundColor: `${getStepColor(index)}.light`,
//                             color: `${getStepColor(index)}.main`,
//                           }}
//                         >
//                           {getStepIcon(index, step)}
//                         </Box>
//                       )}
//                     >
//                       <Typography
//                         variant="subtitle1"
//                         sx={{ fontWeight: "bold" }}
//                       >
//                         {step.label}
//                       </Typography>
//                     </StepLabel>
//                     <StepContent>
//                       <Typography variant="body2" color="text.secondary">
//                         {step.description}
//                       </Typography>
//                     </StepContent>
//                   </Step>
//                 ))}
//               </Stepper>

//               {/* Action Buttons */}
//               <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
//                 <Button
//                   variant="contained"
//                   size="large"
//                   startIcon={<PlayArrowIcon />}
//                   onClick={() => setConfirmDialog(true)}
//                   disabled={isInitializing || isValidating}
//                 >
//                   Initialize Database
//                 </Button>
//                 <Button
//                   variant="outlined"
//                   size="large"
//                   startIcon={<RefreshIcon />}
//                   onClick={handleValidate}
//                   disabled={isInitializing || isValidating}
//                 >
//                   Validate Structure
//                 </Button>
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Validation Results */}
//         <Grid container spacing={3} sx={{ margin: 0, width: "100%" }}>
//           <Card sx={{ width: "100%" }}>
//             <CardContent>
//               <Box
//                 sx={{
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   width: "100%",
//                 }}
//               >
//                 <Typography
//                   variant="h6"
//                   component="h2"
//                   gutterBottom
//                   sx={{ fontWeight: "bold" }}
//                 >
//                   Database Status
//                 </Typography>

//                 {isValidating && (
//                   <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
//                     <LinearProgress sx={{ flexGrow: 1, mr: 2 }} />
//                     <Typography variant="body2">Checking...</Typography>
//                   </Box>
//                 )}

//                 {validationResults && (
//                   <Box>
//                     <Alert
//                       severity={
//                         validationResults.isValid ? "success" : "warning"
//                       }
//                       sx={{ mb: 2 }}
//                     >
//                       <AlertTitle>
//                         {validationResults.isValid
//                           ? "Database Ready"
//                           : "Setup Required"}
//                       </AlertTitle>
//                       {validationResults.isValid
//                         ? "Your database is properly configured and ready to use."
//                         : "Database initialization is required to get started."}
//                     </Alert>

//                     <List dense>
//                       <ListItem>
//                         <ListItemIcon>
//                           <LocalOfferIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Labels"
//                           secondary={`${validationResults.labels || 0} items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.labels > 0 ? "Ready" : "Empty"
//                           }
//                           color={
//                             validationResults.labels > 0 ? "success" : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                       <Divider />
//                       <ListItem>
//                         <ListItemIcon>
//                           <RestaurantMenuIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Ingredients"
//                           secondary={`${
//                             validationResults.ingredients || 0
//                           } items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.ingredients > 0
//                               ? "Ready"
//                               : "Empty"
//                           }
//                           color={
//                             validationResults.ingredients > 0
//                               ? "success"
//                               : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                       <Divider />
//                       <ListItem>
//                         <ListItemIcon>
//                           <FastfoodIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Meals"
//                           secondary={`${validationResults.meals || 0} items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.meals > 0 ? "Ready" : "Empty"
//                           }
//                           color={
//                             validationResults.meals > 0 ? "success" : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                       <Divider />
//                       <ListItem>
//                         <ListItemIcon>
//                           <TimelineIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Macro Plans"
//                           secondary={`${validationResults.plans || 0} items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.plans > 0 ? "Ready" : "Empty"
//                           }
//                           color={
//                             validationResults.plans > 0 ? "success" : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                       <Divider />
//                       <ListItem>
//                         <ListItemIcon>
//                           <PackageIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Packages"
//                           secondary={`${validationResults.packages || 0} items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.packages > 0 ? "Ready" : "Empty"
//                           }
//                           color={
//                             validationResults.packages > 0
//                               ? "success"
//                               : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                       <Divider />
//                       <ListItem>
//                         <ListItemIcon>
//                           <CalendarIcon />
//                         </ListItemIcon>
//                         <ListItemText
//                           primary="Weekly Menus"
//                           secondary={`${
//                             validationResults.templates || 0
//                           } items`}
//                         />
//                         <Chip
//                           label={
//                             validationResults.templates > 0 ? "Ready" : "Empty"
//                           }
//                           color={
//                             validationResults.templates > 0
//                               ? "success"
//                               : "warning"
//                           }
//                           size="small"
//                         />
//                       </ListItem>
//                     </List>
//                   </Box>
//                 )}

//                 {!validationResults && !isValidating && (
//                   <Alert severity="info">
//                     <AlertTitle>Click "Validate Structure"</AlertTitle>
//                     Check your current database status and see what needs to be
//                     set up.
//                   </Alert>
//                 )}
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Order Migration Section */}
//       <Grid container spacing={3} sx={{ mt: 2 }}>
//         <Grid item xs={12}>
//           <Card>
//             <CardContent>
//               <Typography
//                 variant="h6"
//                 component="h2"
//                 gutterBottom
//                 sx={{
//                   fontWeight: "bold",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 <AutoFixHighIcon sx={{ mr: 1 }} />
//                 Order Status Migration
//               </Typography>

//               <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                 Legacy orders may be missing daily status tracking. Use these
//                 tools to analyze and migrate existing orders.
//               </Typography>

//               {/* Analysis Section */}
//               <Box sx={{ mb: 3 }}>
//                 <Box
//                   sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}
//                 >
//                   <Button
//                     variant="outlined"
//                     size="medium"
//                     startIcon={<BugReportIcon />}
//                     onClick={handleAnalyzeMigration}
//                     disabled={isAnalyzing || isMigrating}
//                   >
//                     Analyze Orders
//                   </Button>

//                   {isAnalyzing && (
//                     <Box sx={{ display: "flex", alignItems: "center" }}>
//                       <LinearProgress sx={{ width: 200, mr: 2 }} />
//                       <Typography variant="body2">Analyzing...</Typography>
//                     </Box>
//                   )}
//                 </Box>

//                 {analysisResults && (
//                   <Alert
//                     severity={
//                       analysisResults.needsMigration > 0 ? "warning" : "success"
//                     }
//                     sx={{ mb: 2 }}
//                   >
//                     <AlertTitle>Analysis Results</AlertTitle>
//                     {analysisResults.needsMigration > 0
//                       ? `${analysisResults.needsMigration} orders need migration out of ${analysisResults.totalOrders} total.`
//                       : `All ${analysisResults.totalOrders} orders are up to date.`}
//                   </Alert>
//                 )}

//                 {analysisResults && (
//                   <Grid container spacing={2}>
//                     <Grid item xs={6} sm={3}>
//                       <Paper sx={{ p: 2, textAlign: "center" }}>
//                         <Typography variant="h4" color="primary">
//                           {analysisResults.totalOrders}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           Total Orders
//                         </Typography>
//                       </Paper>
//                     </Grid>
//                     <Grid item xs={6} sm={3}>
//                       <Paper sx={{ p: 2, textAlign: "center" }}>
//                         <Typography variant="h4" color="warning.main">
//                           {analysisResults.needsMigration}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           Need Migration
//                         </Typography>
//                       </Paper>
//                     </Grid>
//                     <Grid item xs={6} sm={3}>
//                       <Paper sx={{ p: 2, textAlign: "center" }}>
//                         <Typography variant="h4" color="info.main">
//                           {analysisResults.hasEmptyStatuses}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           Empty Status
//                         </Typography>
//                       </Paper>
//                     </Grid>
//                     <Grid item xs={6} sm={3}>
//                       <Paper sx={{ p: 2, textAlign: "center" }}>
//                         <Typography variant="h4" color="success.main">
//                           {analysisResults.alreadyMigrated}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           Already Migrated
//                         </Typography>
//                       </Paper>
//                     </Grid>
//                   </Grid>
//                 )}
//               </Box>

//               {/* Migration Action */}
//               {analysisResults && analysisResults.needsMigration > 0 && (
//                 <Box>
//                   <Button
//                     variant="contained"
//                     color="warning"
//                     size="large"
//                     startIcon={<AutoFixHighIcon />}
//                     onClick={() => setMigrationDialog(true)}
//                     disabled={isAnalyzing || isMigrating}
//                   >
//                     Migrate {analysisResults.needsMigration} Orders
//                   </Button>

//                   {migrationResults && (
//                     <Alert severity="success" sx={{ mt: 2 }}>
//                       <AlertTitle>Migration Complete</AlertTitle>
//                       Successfully migrated {migrationResults.updated} orders.
//                       {migrationResults.errors > 0 &&
//                         ` ${migrationResults.errors} errors encountered.`}
//                     </Alert>
//                   )}
//                 </Box>
//               )}

//               {analysisResults && analysisResults.needsMigration === 0 && (
//                 <Alert severity="success">
//                   <AlertTitle>No Migration Needed</AlertTitle>
//                   All orders are up to date with daily status tracking.
//                 </Alert>
//               )}
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Confirmation Dialog */}
//       <Dialog
//         open={confirmDialog}
//         onClose={() => setConfirmDialog(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>
//           <Box sx={{ display: "flex", alignItems: "center" }}>
//             <WarningIcon sx={{ mr: 2, color: "warning.main" }} />
//             Initialize Database
//           </Box>
//         </DialogTitle>
//         <DialogContent>
//           <Typography variant="body1" sx={{ mb: 2, textAlign: "left" }}>
//             This will create sample data in your Firestore database including:
//           </Typography>
//           <List dense>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="6 dietary labels (Gluten Free, High Protein, etc.)" />
//             </ListItem>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="8 common ingredients with nutrition data" />
//             </ListItem>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="3 sample meals with calculated nutrition" />
//             </ListItem>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="3 macro plans (High Protein, Balanced, Keto)" />
//             </ListItem>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="9 meal packages (3 per macro plan)" />
//             </ListItem>
//             <ListItem>
//               <ListItemIcon>
//                 <CheckCircleIcon color="success" />
//               </ListItemIcon>
//               <ListItemText primary="1 weekly menu template" />
//             </ListItem>
//           </List>
//           <Alert severity="info" sx={{ mt: 2 }}>
//             This is safe to run multiple times and won't duplicate data.
//           </Alert>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
//           <Button onClick={handleInitialize} variant="contained" autoFocus>
//             Initialize Now
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }
