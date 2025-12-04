/\*\*

- Skip Request Integration Example for TodayOrders.jsx
- This shows how to integrate the skip request system into existing order management
  \*/

// Add these imports to TodayOrders.jsx:
import { SkipRequestStatsWidget, PendingSkipRequestsList } from "../components/SkipRequestStatsWidget";
import { SkipRequestDialog } from "../components/SkipRequestManager";
import { getOrdersWithPendingSkipRequests } from "../utils/skipRequestUtils";

// Add these state variables to TodayOrders component:
const [skipRequestDialog, setSkipRequestDialog] = useState({
open: false,
orderId: null,
date: null,
userMealSelectionId: null
});
const [showPendingSkipRequests, setShowPendingSkipRequests] = useState(false);

// Add these handler functions:
const handleReviewSkipRequest = (orderId, date, userMealSelectionId) => {
setSkipRequestDialog({
open: true,
orderId,
date,
userMealSelectionId
});
};

const handleSkipRequestActionCompleted = (action) => {
setSkipRequestDialog({
open: false,
orderId: null,
date: null,
userMealSelectionId: null
});

// Refresh orders after skip request action
fetchTodayOrders();
};

const handleViewPendingRequests = () => {
setShowPendingSkipRequests(true);
};

// Add this to the JSX return (after OrderStatsGrid):

{/_ Skip Request Statistics Widget _/}
<Grid item xs={12} md={6}>
<SkipRequestStatsWidget
    orders={orders}
    date={getTodayDateISO()}
    onViewPendingRequests={handleViewPendingRequests}
  />
</Grid>

// Add this dialog at the end of the component:

{/_ Skip Request Review Dialog _/}
<SkipRequestDialog
open={skipRequestDialog.open}
onClose={() => setSkipRequestDialog({
open: false,
orderId: null,
date: null,
userMealSelectionId: null
})}
orderId={skipRequestDialog.orderId}
date={skipRequestDialog.date}
userMealSelectionId={skipRequestDialog.userMealSelectionId}
onActionCompleted={handleSkipRequestActionCompleted}
/>

{/_ Pending Skip Requests Dialog _/}

<Dialog 
  open={showPendingSkipRequests} 
  onClose={() => setShowPendingSkipRequests(false)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>Pending Skip Requests</DialogTitle>
  <DialogContent>
    <PendingSkipRequestsList
      orders={orders}
      date={getTodayDateISO()}
      onReviewRequest={handleReviewSkipRequest}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowPendingSkipRequests(false)}>
      Close
    </Button>
  </DialogActions>
</Dialog>

// Usage in the OrderCard component (already implemented):
// The OrderCard will automatically show skip request indicators
// and handle the review dialogs when there are pending requests

// For the client app (React Native), use this API structure:

/\*\*

- Client App API Usage Example
  \*/

// 1. Submit skip request (from client app):
import { handleUserSkipRequest, SKIP_REQUEST_TYPES } from './services/orderSynchronization';

const submitSkipRequest = async (orderId, userMealSelectionId, date, userId, reason) => {
try {
const result = await handleUserSkipRequest(
orderId,
userMealSelectionId,
date,
userId,
reason
);

    if (result.success) {
      // Show success message to user
      alert('Skip request submitted successfully. Admin will review and update your order.');
    }

} catch (error) {
// Handle error
console.error('Failed to submit skip request:', error);
}
};

// 2. Get skip status for display (from client app):
import { getClientSkipReason } from './utils/skipRequestUtils';

const DisplayOrderStatus = ({ order, date }) => {
const skipInfo = getClientSkipReason(order, date);

if (skipInfo.isSkipped) {
return (
<View>
<Text>Status: Skipped</Text>
<Text>Reason: {skipInfo.reason}</Text>
<Text>Source: {skipInfo.source === 'user' ? 'Your request' : 'Admin action'}</Text>
{skipInfo.canModify && (
<Button title="Cancel Skip Request" onPress={cancelSkipRequest} />
)}
</View>
);
}

return (
<View>
<Text>Status: Active</Text>
<Button title="Request Skip Day" onPress={requestSkipDay} />
</View>
);
};

// 3. Data structure examples:

/\*\*

- Example order with skip request (userMealSelections collection):
  \*/
  const exampleMealSelection = {
  orderId: "order_123",
  dailySelections: {
  "2025-08-07": {
  isSkipped: true,
  skipRequestType: "user_request",
  skipRequestStatus: "pending",
  skipRequestedBy: "user_456",
  skipRequestedAt: new Date(),
  skipReason: "Going on vacation",
  adminActionRequired: true,
  adminNotified: false
  }
  }
  };

/\*\*

- Example order status after admin approval (orders collection):
  \*/
  const exampleOrderStatus = {
  orderId: "order_123",
  dailyStatuses: {
  "2025-08-07": {
  status: "delivery_skipped",
  updatedAt: new Date(),
  updatedBy: "admin_123",
  notes: "Approved user skip request. Customer going on vacation",
  skipReason: "User Request",
  skipRequestApprovedAt: new Date()
  }
  }
  };

export {
submitSkipRequest,
DisplayOrderStatus,
exampleMealSelection,
exampleOrderStatus
};
