import ContactRequest from "../models/contactRequest.model.js";
import User from "../models/user.model.js";

// Create a contact request (requester side)
export const createContactRequest = async (req, res) => {
  try {
    const { donorId, bloodType, units, urgency, purpose, requiredBy, hospital, patientName, patientAge, patientGender, relationship } = req.body;
    
    console.log('Contact request data:', { donorId, bloodType, units, urgency, purpose, relationship });
    console.log('User data:', { userId: req.user._id, name: req.user.fullName, email: req.user.email });
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate donor exists and is available
    const donor = await User.findById(donorId);
    console.log('Donor lookup result:', { donorId, donorFound: !!donor, donorAvailable: donor?.available });
    
    if (!donor) {
      return res.status(404).json({ error: "Donor not found" });
    }

    if (!donor.available) {
      return res.status(400).json({ error: "Donor is not currently available" });
    }

    // Check if there's already a pending request
    const existingRequest = await ContactRequest.findOne({
      "donor.userId": donorId,
      "requester.userId": req.user._id,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending request with this donor" });
    }

    // Generate unique request ID
    const requestId = `CR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const contactRequest = new ContactRequest({
      requestId,
      requester: {
        userId: req.user._id,
        name: req.user.fullName,
        phone: req.user.phoneNumber,
        email: req.user.email,
        relationship
      },
      donor: {
        userId: donor._id,
        name: donor.fullName,
        phone: donor.phoneNumber // Will be hidden until approved
      },
      bloodRequest: {
        bloodType,
        units,
        urgency: urgency || "routine",
        purpose,
        requiredBy,
        hospital,
        patientName,
        patientAge,
        patientGender
      },
      location: req.user.location
    });

    await contactRequest.save();

    res.status(201).json({
      success: true,
      data: {
        requestId: contactRequest.requestId,
        status: contactRequest.status,
        message: "Contact request sent successfully. Donor will be notified."
      }
    });

  } catch (error) {
    console.error("Error creating contact request:", error);
    res.status(500).json({ error: "Failed to create contact request" });
  }
};

// Get contact requests for a donor (donor side)
export const getDonorRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const requests = await ContactRequest.find({
      "donor.userId": req.user._id
    }).sort({ "timeline.requestedAt": -1 });

    // Don't send donor's own phone number back to them
    const sanitizedRequests = requests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.donor) {
        delete requestObj.donor.phone;
      }
      return requestObj;
    });

    res.json({
      success: true,
      data: sanitizedRequests,
      count: sanitizedRequests.length
    });

  } catch (error) {
    console.error("Error getting donor requests:", error);
    res.status(500).json({ error: "Failed to get requests" });
  }
};

// Get contact requests made by user (requester side)
export const getRequesterRequests = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const requests = await ContactRequest.find({
      "requester.userId": req.user._id
    }).sort({ "timeline.requestedAt": -1 });

    // Don't send donor's phone number unless approved
    const sanitizedRequests = requests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.donor && requestObj.status !== "approved") {
        delete requestObj.donor.phone;
      }
      return requestObj;
    });

    res.json({
      success: true,
      data: sanitizedRequests,
      count: sanitizedRequests.length
    });

  } catch (error) {
    console.error("Error getting requester requests:", error);
    res.status(500).json({ error: "Failed to get requests" });
  }
};

// Donor responds to a contact request
export const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, message, availableDate, preferredContact } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const contactRequest = await ContactRequest.findOne({
      requestId,
      "donor.userId": req.user._id,
      status: "pending"
    });

    if (!contactRequest) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }

    // Update the request
    contactRequest.status = action === "approved" ? "approved" : "rejected";
    contactRequest.donorResponse = {
      action,
      message,
      availableDate,
      preferredContact,
      responseTime: new Date()
    };
    contactRequest.timeline.respondedAt = new Date();

    // If approved, share contact information
    if (action === "approved") {
      contactRequest.privacy.showPhone = true;
      contactRequest.privacy.allowDirectContact = true;
      contactRequest.timeline.contactSharedAt = new Date();
    }

    await contactRequest.save();

    res.json({
      success: true,
      data: {
        requestId: contactRequest.requestId,
        status: contactRequest.status,
        message: `Request ${action} successfully`
      }
    });

  } catch (error) {
    console.error("Error responding to request:", error);
    res.status(500).json({ error: "Failed to respond to request" });
  }
};

// Get specific contact request details (with privacy controls)
export const getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const contactRequest = await ContactRequest.findOne({ requestId });

    if (!contactRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check if user is authorized to view this request
    const isDonor = contactRequest.donor.userId.toString() === req.user._id.toString();
    const isRequester = contactRequest.requester.userId.toString() === req.user._id.toString();

    if (!isDonor && !isRequester) {
      return res.status(403).json({ error: "Not authorized to view this request" });
    }

    const requestObj = contactRequest.toObject();

    // Apply privacy controls
    if (isRequester) {
      // Requester can see donor's phone only if approved
      if (contactRequest.status !== "approved") {
        delete requestObj.donor.phone;
      }
    } else if (isDonor) {
      // Donor can't see their own phone number in the response
      delete requestObj.donor.phone;
    }

    res.json({
      success: true,
      data: requestObj
    });

  } catch (error) {
    console.error("Error getting request details:", error);
    res.status(500).json({ error: "Failed to get request details" });
  }
};

// Mark request as completed
export const completeRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const contactRequest = await ContactRequest.findOne({ requestId });

    if (!contactRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Check if user is authorized
    const isDonor = contactRequest.donor.userId.toString() === req.user._id.toString();
    const isRequester = contactRequest.requester.userId.toString() === req.user._id.toString();

    if (!isDonor && !isRequester) {
      return res.status(403).json({ error: "Not authorized to complete this request" });
    }

    contactRequest.status = "completed";
    contactRequest.timeline.completedAt = new Date();

    await contactRequest.save();

    res.json({
      success: true,
      data: {
        requestId: contactRequest.requestId,
        status: contactRequest.status,
        message: "Request marked as completed"
      }
    });

  } catch (error) {
    console.error("Error completing request:", error);
    res.status(500).json({ error: "Failed to complete request" });
  }
}; 