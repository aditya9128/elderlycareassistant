const MedicalReminder = require('../models/MedicalReminder');

class ReminderController {
    
    // Create new reminder
    async createReminder(req, res) {
        try {
            const userId = req.user.id;
            const reminderData = {
                userId,
                ...req.body
            };
            
            const reminder = await MedicalReminder.create(reminderData);
            
            res.status(201).json({
                success: true,
                message: 'Reminder created successfully',
                data: reminder
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get user's reminders
    async getUserReminders(req, res) {
        try {
            const { category, status, page = 1, limit = 10 } = req.query;
            const userId = req.user.id;
            
            const query = { userId };
            
            if (category) {
                query.category = category;
            }
            
            if (status) {
                query.status = status;
            } else {
                query.isActive = true;
            }
            
            const skip = (page - 1) * limit;
            
            const reminders = await MedicalReminder.find(query)
                .sort({ nextReminder: 1, priority: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            const total = await MedicalReminder.countDocuments(query);
            
            // Categorize reminders
            const dueReminders = reminders.filter(r => r.isDue);
            const upcomingReminders = reminders.filter(r => !r.isDue && r.status === 'Active');
            
            res.status(200).json({
                success: true,
                count: reminders.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                categories: {
                    due: dueReminders.length,
                    upcoming: upcomingReminders.length,
                    total: total
                },
                data: reminders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get reminder by ID
    async getReminderById(req, res) {
        try {
            const reminder = await MedicalReminder.findById(req.params.id);
            
            if (!reminder) {
                return res.status(404).json({
                    success: false,
                    message: 'Reminder not found'
                });
            }
            
            // Check authorization
            if (reminder.userId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to view this reminder'
                });
            }
            
            res.status(200).json({
                success: true,
                data: reminder
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Update reminder
    async updateReminder(req, res) {
        try {
            const reminder = await MedicalReminder.findById(req.params.id);
            
            if (!reminder) {
                return res.status(404).json({
                    success: false,
                    message: 'Reminder not found'
                });
            }
            
            // Check authorization
            if (reminder.userId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this reminder'
                });
            }
            
            // Fields that can be updated
            const allowedUpdates = [
                'title', 'description', 'category', 'medicineName', 'dosage',
                'dosageInfo', 'medicineType', 'scheduleType', 'times',
                'daysOfWeek', 'interval', 'duration', 'frequency',
                'notifications', 'status', 'priority', 'notes',
                'location', 'doctorName', 'doctorContact'
            ];
            
            const updates = {};
            Object.keys(req.body).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = req.body[key];
                }
            });
            
            // If status is changed to completed/cancelled, set isActive to false
            if (['Completed', 'Cancelled', 'Expired'].includes(req.body.status)) {
                updates.isActive = false;
            }
            
            const updatedReminder = await MedicalReminder.findByIdAndUpdate(
                req.params.id,
                updates,
                { new: true, runValidators: true }
            );
            
            res.status(200).json({
                success: true,
                message: 'Reminder updated successfully',
                data: updatedReminder
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Delete reminder
    async deleteReminder(req, res) {
        try {
            const reminder = await MedicalReminder.findById(req.params.id);
            
            if (!reminder) {
                return res.status(404).json({
                    success: false,
                    message: 'Reminder not found'
                });
            }
            
            // Check authorization
            if (reminder.userId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this reminder'
                });
            }
            
            await MedicalReminder.findByIdAndDelete(req.params.id);
            
            res.status(200).json({
                success: true,
                message: 'Reminder deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Mark reminder as completed
    async markAsCompleted(req, res) {
        try {
            const { reminderId } = req.params;
            const { status = 'Taken', notes = '' } = req.body;
            
            const reminder = await MedicalReminder.findById(reminderId);
            
            if (!reminder) {
                return res.status(404).json({
                    success: false,
                    message: 'Reminder not found'
                });
            }
            
            // Check authorization
            if (reminder.userId.toString() !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this reminder'
                });
            }
            
            await reminder.markAsCompleted(status, notes, req.user.id, 'User');
            
            res.status(200).json({
                success: true,
                message: `Reminder marked as ${status.toLowerCase()}`,
                data: {
                    streak: reminder.streak.current,
                    completionRate: reminder.completionRate
                }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get reminder statistics
    async getReminderStats(req, res) {
        try {
            const userId = req.user.id;
            
            const stats = await MedicalReminder.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        active: {
                            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
                        },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                        },
                        byCategory: {
                            $push: '$category'
                        }
                    }
                }
            ]);
            
            // Get due reminders count
            const dueReminders = await MedicalReminder.countDocuments({
                userId: userId,
                isActive: true,
                status: 'Active',
                nextReminder: { $lte: new Date() }
            });
            
            // Get streak data
            const reminders = await MedicalReminder.find({ userId: userId });
            const currentStreak = reminders.reduce((max, r) => 
                Math.max(max, r.streak.current), 0
            );
            const longestStreak = reminders.reduce((max, r) => 
                Math.max(max, r.streak.longest), 0
            );
            
            const result = {
                total: stats[0]?.total || 0,
                active: stats[0]?.active || 0,
                completed: stats[0]?.completed || 0,
                due: dueReminders,
                streaks: {
                    current: currentStreak,
                    longest: longestStreak
                },
                categories: stats[0]?.byCategory || []
            };
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
    
    // Get due reminders
    async getDueReminders(req, res) {
        try {
            const dueReminders = await MedicalReminder.find({
                userId: req.user.id,
                isActive: true,
                status: 'Active',
                nextReminder: { $lte: new Date() }
            }).sort({ priority: -1, nextReminder: 1 });
            
            res.status(200).json({
                success: true,
                count: dueReminders.length,
                data: dueReminders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new ReminderController();