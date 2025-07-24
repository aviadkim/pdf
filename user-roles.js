/**
 * USER ROLES AND PERMISSIONS SYSTEM
 * Advanced role-based access control with hierarchical permissions
 * 
 * Features:
 * - Hierarchical role structure
 * - Granular permission system
 * - Dynamic role assignment
 * - Permission inheritance
 * - Resource-based permissions
 * - Audit trail for role changes
 */

class UserRoles {
    constructor(options = {}) {
        this.config = {
            enableInheritance: options.enableInheritance !== false,
            auditRoleChanges: options.auditRoleChanges !== false,
            defaultRole: options.defaultRole || 'user',
            maxRolesPerUser: options.maxRolesPerUser || 5
        };
        
        this.roles = new Map();
        this.permissions = new Map();
        this.userRoles = new Map();
        this.roleHierarchy = new Map();
        this.auditLog = [];
        
        this.initializeDefaultRoles();
        this.initializeDefaultPermissions();
        
        console.log('👥 User Roles System initialized');
        console.log(`🔒 Role inheritance: ${this.config.enableInheritance ? 'enabled' : 'disabled'}`);
    }

    // Initialize default roles and permissions
    initializeDefaultRoles() {
        const defaultRoles = [
            {
                id: 'super_admin',
                name: 'Super Administrator',
                description: 'Full system access with all administrative privileges',
                level: 100,
                inherits: [],
                permissions: ['*'] // All permissions
            },
            {
                id: 'admin',
                name: 'Administrator',
                description: 'Administrative access to most system features',
                level: 90,
                inherits: ['expert'],
                permissions: [
                    'users.manage',
                    'system.configure',
                    'analytics.view',
                    'audit.view',
                    'api_keys.manage',
                    'roles.manage'
                ]
            },
            {
                id: 'expert',
                name: 'Domain Expert',
                description: 'Financial experts who can validate and correct extractions',
                level: 70,
                inherits: ['power_user'],
                permissions: [
                    'documents.validate',
                    'annotations.create',
                    'annotations.approve',
                    'patterns.create',
                    'learning.supervise',
                    'reports.create'
                ]
            },
            {
                id: 'power_user',
                name: 'Power User',
                description: 'Advanced users with enhanced processing capabilities',
                level: 50,
                inherits: ['user'],
                permissions: [
                    'batch.create',
                    'batch.priority_high',
                    'documents.reprocess',
                    'analytics.basic',
                    'exports.advanced'
                ]
            },
            {
                id: 'user',
                name: 'Standard User',
                description: 'Regular users with basic document processing capabilities',
                level: 30,
                inherits: ['viewer'],
                permissions: [
                    'documents.upload',
                    'documents.process',
                    'annotations.basic',
                    'batch.create_basic',
                    'exports.basic'
                ]
            },
            {
                id: 'viewer',
                name: 'Viewer',
                description: 'Read-only access to view documents and results',
                level: 10,
                inherits: [],
                permissions: [
                    'documents.view',
                    'results.view',
                    'profile.view'
                ]
            },
            {
                id: 'api_user',
                name: 'API User',
                description: 'Programmatic access via API keys',
                level: 40,
                inherits: [],
                permissions: [
                    'api.documents.process',
                    'api.batch.create',
                    'api.results.view',
                    'api.webhooks.manage'
                ]
            }
        ];
        
        for (const role of defaultRoles) {
            this.roles.set(role.id, role);
        }
        
        this.buildRoleHierarchy();
        console.log(`📋 Initialized ${defaultRoles.length} default roles`);
    }

    initializeDefaultPermissions() {
        const permissionCategories = {
            // Document Management
            documents: [
                { id: 'documents.view', name: 'View Documents', description: 'View uploaded documents and their status' },
                { id: 'documents.upload', name: 'Upload Documents', description: 'Upload new documents for processing' },
                { id: 'documents.process', name: 'Process Documents', description: 'Initiate document processing' },
                { id: 'documents.reprocess', name: 'Reprocess Documents', description: 'Reprocess existing documents' },
                { id: 'documents.delete', name: 'Delete Documents', description: 'Delete documents and their data' },
                { id: 'documents.validate', name: 'Validate Documents', description: 'Validate and approve processed documents' }
            ],
            
            // Results and Analytics
            results: [
                { id: 'results.view', name: 'View Results', description: 'View processing results and extracted data' },
                { id: 'results.export', name: 'Export Results', description: 'Export results in various formats' },
                { id: 'results.modify', name: 'Modify Results', description: 'Edit and correct extraction results' }
            ],
            
            // Annotations and Learning
            annotations: [
                { id: 'annotations.basic', name: 'Basic Annotations', description: 'Create basic corrections and annotations' },
                { id: 'annotations.create', name: 'Create Annotations', description: 'Create detailed annotations and corrections' },
                { id: 'annotations.approve', name: 'Approve Annotations', description: 'Approve and validate annotations from others' },
                { id: 'annotations.delete', name: 'Delete Annotations', description: 'Delete annotations and corrections' }
            ],
            
            // Batch Processing
            batch: [
                { id: 'batch.create_basic', name: 'Basic Batch Processing', description: 'Create small batches (up to 10 documents)' },
                { id: 'batch.create', name: 'Batch Processing', description: 'Create medium batches (up to 100 documents)' },
                { id: 'batch.create_large', name: 'Large Batch Processing', description: 'Create large batches (100+ documents)' },
                { id: 'batch.priority_high', name: 'High Priority Batches', description: 'Create high-priority batch jobs' },
                { id: 'batch.manage', name: 'Manage Batches', description: 'Cancel and modify batch jobs' }
            ],
            
            // Learning and Patterns
            learning: [
                { id: 'learning.supervise', name: 'Supervise Learning', description: 'Supervise and guide ML model learning' },
                { id: 'patterns.create', name: 'Create Patterns', description: 'Create and manage learning patterns' },
                { id: 'patterns.approve', name: 'Approve Patterns', description: 'Approve patterns for global use' }
            ],
            
            // System and Administration
            system: [
                { id: 'system.configure', name: 'System Configuration', description: 'Configure system settings and parameters' },
                { id: 'system.monitor', name: 'System Monitoring', description: 'Monitor system health and performance' },
                { id: 'system.backup', name: 'System Backup', description: 'Create and manage system backups' }
            ],
            
            // User Management
            users: [
                { id: 'users.view', name: 'View Users', description: 'View user profiles and information' },
                { id: 'users.manage', name: 'Manage Users', description: 'Create, edit, and deactivate users' },
                { id: 'users.impersonate', name: 'Impersonate Users', description: 'Act on behalf of other users' }
            ],
            
            // Role Management
            roles: [
                { id: 'roles.view', name: 'View Roles', description: 'View role definitions and assignments' },
                { id: 'roles.manage', name: 'Manage Roles', description: 'Create and modify roles and permissions' },
                { id: 'roles.assign', name: 'Assign Roles', description: 'Assign roles to users' }
            ],
            
            // API and Integration
            api: [
                { id: 'api.documents.process', name: 'API Document Processing', description: 'Process documents via API' },
                { id: 'api.batch.create', name: 'API Batch Processing', description: 'Create batches via API' },
                { id: 'api.results.view', name: 'API Results Access', description: 'Access results via API' },
                { id: 'api.webhooks.manage', name: 'API Webhook Management', description: 'Manage webhooks and notifications' }
            ],
            
            // Analytics and Reporting
            analytics: [
                { id: 'analytics.basic', name: 'Basic Analytics', description: 'View basic usage and performance metrics' },
                { id: 'analytics.view', name: 'Advanced Analytics', description: 'View detailed analytics and reports' },
                { id: 'analytics.export', name: 'Export Analytics', description: 'Export analytics data and reports' }
            ],
            
            // Exports and Integration
            exports: [
                { id: 'exports.basic', name: 'Basic Exports', description: 'Export data in standard formats (JSON, CSV)' },
                { id: 'exports.advanced', name: 'Advanced Exports', description: 'Export data in advanced formats (Excel, PDF)' },
                { id: 'exports.api', name: 'API Exports', description: 'Export data via API integrations' }
            ],
            
            // Audit and Compliance
            audit: [
                { id: 'audit.view', name: 'View Audit Logs', description: 'View system audit logs and user activities' },
                { id: 'audit.export', name: 'Export Audit Data', description: 'Export audit logs for compliance' }
            ],
            
            // API Keys and Security
            api_keys: [
                { id: 'api_keys.create', name: 'Create API Keys', description: 'Create new API keys' },
                { id: 'api_keys.manage', name: 'Manage API Keys', description: 'Manage and revoke API keys' },
                { id: 'api_keys.view_all', name: 'View All API Keys', description: 'View API keys for all users' }
            ],
            
            // Profile Management
            profile: [
                { id: 'profile.view', name: 'View Profile', description: 'View own profile information' },
                { id: 'profile.edit', name: 'Edit Profile', description: 'Edit own profile information' },
                { id: 'profile.delete', name: 'Delete Profile', description: 'Delete own account' }
            ],
            
            // Reports
            reports: [
                { id: 'reports.create', name: 'Create Reports', description: 'Create custom reports and dashboards' },
                { id: 'reports.schedule', name: 'Schedule Reports', description: 'Schedule automated report generation' },
                { id: 'reports.share', name: 'Share Reports', description: 'Share reports with other users' }
            ]
        };
        
        let totalPermissions = 0;
        for (const [category, permissions] of Object.entries(permissionCategories)) {
            for (const permission of permissions) {
                this.permissions.set(permission.id, {
                    ...permission,
                    category
                });
                totalPermissions++;
            }
        }
        
        console.log(`🔐 Initialized ${totalPermissions} permissions across ${Object.keys(permissionCategories).length} categories`);
    }

    // Role Management
    createRole(roleData) {
        const { id, name, description, level, inherits = [], permissions = [] } = roleData;
        
        if (this.roles.has(id)) {
            throw new Error(`Role already exists: ${id}`);
        }
        
        // Validate inherited roles exist
        for (const inheritedRole of inherits) {
            if (!this.roles.has(inheritedRole)) {
                throw new Error(`Inherited role does not exist: ${inheritedRole}`);
            }
        }
        
        // Validate permissions exist
        for (const permission of permissions) {
            if (permission !== '*' && !this.permissions.has(permission)) {
                throw new Error(`Permission does not exist: ${permission}`);
            }
        }
        
        const role = {
            id,
            name,
            description,
            level: level || 30,
            inherits,
            permissions,
            createdAt: new Date().toISOString(),
            custom: true
        };
        
        this.roles.set(id, role);
        this.buildRoleHierarchy();
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'role_created',
                roleId: id,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Role created: ${name} (${id})`);
        return role;
    }

    updateRole(roleId, updates) {
        const role = this.roles.get(roleId);
        if (!role) {
            throw new Error(`Role not found: ${roleId}`);
        }
        
        // Prevent modification of system roles
        if (!role.custom && updates.permissions) {
            throw new Error('Cannot modify permissions of system roles');
        }
        
        const originalRole = { ...role };
        Object.assign(role, updates);
        role.updatedAt = new Date().toISOString();
        
        this.buildRoleHierarchy();
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'role_updated',
                roleId,
                changes: updates,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Role updated: ${role.name} (${roleId})`);
        return role;
    }

    deleteRole(roleId) {
        const role = this.roles.get(roleId);
        if (!role) {
            throw new Error(`Role not found: ${roleId}`);
        }
        
        if (!role.custom) {
            throw new Error('Cannot delete system roles');
        }
        
        // Check if role is in use
        for (const [userId, userRoles] of this.userRoles.entries()) {
            if (userRoles.includes(roleId)) {
                throw new Error(`Cannot delete role in use by users`);
            }
        }
        
        this.roles.delete(roleId);
        this.buildRoleHierarchy();
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'role_deleted',
                roleId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Role deleted: ${roleId}`);
        return { success: true };
    }

    // User Role Assignment
    assignRole(userId, roleId) {
        if (!this.roles.has(roleId)) {
            throw new Error(`Role not found: ${roleId}`);
        }
        
        const userRoles = this.userRoles.get(userId) || [];
        
        if (userRoles.includes(roleId)) {
            throw new Error(`User already has role: ${roleId}`);
        }
        
        if (userRoles.length >= this.config.maxRolesPerUser) {
            throw new Error(`User has reached maximum number of roles (${this.config.maxRolesPerUser})`);
        }
        
        userRoles.push(roleId);
        this.userRoles.set(userId, userRoles);
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'role_assigned',
                userId,
                roleId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Role assigned: ${roleId} to user ${userId}`);
        return this.getUserPermissions(userId);
    }

    removeRole(userId, roleId) {
        const userRoles = this.userRoles.get(userId) || [];
        const roleIndex = userRoles.indexOf(roleId);
        
        if (roleIndex === -1) {
            throw new Error(`User does not have role: ${roleId}`);
        }
        
        userRoles.splice(roleIndex, 1);
        
        if (userRoles.length === 0) {
            // Assign default role if no roles remaining
            userRoles.push(this.config.defaultRole);
        }
        
        this.userRoles.set(userId, userRoles);
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'role_removed',
                userId,
                roleId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Role removed: ${roleId} from user ${userId}`);
        return this.getUserPermissions(userId);
    }

    setUserRoles(userId, roleIds) {
        // Validate all roles exist
        for (const roleId of roleIds) {
            if (!this.roles.has(roleId)) {
                throw new Error(`Role not found: ${roleId}`);
            }
        }
        
        if (roleIds.length > this.config.maxRolesPerUser) {
            throw new Error(`Too many roles (max: ${this.config.maxRolesPerUser})`);
        }
        
        const previousRoles = this.userRoles.get(userId) || [];
        this.userRoles.set(userId, [...roleIds]);
        
        if (this.config.auditRoleChanges) {
            this.auditLog.push({
                action: 'roles_set',
                userId,
                previousRoles,
                newRoles: roleIds,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Roles set for user ${userId}: ${roleIds.join(', ')}`);
        return this.getUserPermissions(userId);
    }

    // Permission Resolution
    getUserPermissions(userId) {
        const userRoles = this.userRoles.get(userId) || [this.config.defaultRole];
        const permissions = new Set();
        
        for (const roleId of userRoles) {
            const rolePermissions = this.getRolePermissions(roleId);
            for (const permission of rolePermissions) {
                permissions.add(permission);
            }
        }
        
        return Array.from(permissions);
    }

    getRolePermissions(roleId) {
        const role = this.roles.get(roleId);
        if (!role) {
            return [];
        }
        
        const permissions = new Set();
        
        // Add direct permissions
        for (const permission of role.permissions) {
            if (permission === '*') {
                // Wildcard permission - add all permissions
                for (const [permId] of this.permissions) {
                    permissions.add(permId);
                }
            } else {
                permissions.add(permission);
            }
        }
        
        // Add inherited permissions if inheritance is enabled
        if (this.config.enableInheritance && role.inherits) {
            for (const inheritedRole of role.inherits) {
                const inheritedPermissions = this.getRolePermissions(inheritedRole);
                for (const permission of inheritedPermissions) {
                    permissions.add(permission);
                }
            }
        }
        
        return Array.from(permissions);
    }

    hasPermission(userId, permission) {
        const userPermissions = this.getUserPermissions(userId);
        return userPermissions.includes(permission) || userPermissions.includes('*');
    }

    hasAnyPermission(userId, permissions) {
        const userPermissions = this.getUserPermissions(userId);
        return permissions.some(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*')
        );
    }

    hasAllPermissions(userId, permissions) {
        const userPermissions = this.getUserPermissions(userId);
        return permissions.every(permission => 
            userPermissions.includes(permission) || userPermissions.includes('*')
        );
    }

    // Resource-based permissions
    hasResourcePermission(userId, permission, resourceId, resourceType) {
        // Check basic permission first
        if (!this.hasPermission(userId, permission)) {
            return false;
        }
        
        // Resource-specific logic can be implemented here
        // For example, users can only access their own documents
        const userRoles = this.userRoles.get(userId) || [];
        const hasAdminRole = userRoles.some(roleId => 
            ['admin', 'super_admin'].includes(roleId)
        );
        
        if (hasAdminRole) {
            return true; // Admins can access all resources
        }
        
        // Implement resource-specific checks here
        // This is a simplified example
        return true;
    }

    // Role Hierarchy
    buildRoleHierarchy() {
        this.roleHierarchy.clear();
        
        for (const [roleId, role] of this.roles) {
            if (role.inherits) {
                for (const inheritedRole of role.inherits) {
                    if (!this.roleHierarchy.has(inheritedRole)) {
                        this.roleHierarchy.set(inheritedRole, new Set());
                    }
                    this.roleHierarchy.get(inheritedRole).add(roleId);
                }
            }
        }
    }

    getRoleHierarchy() {
        const hierarchy = {};
        
        for (const [parentRole, childRoles] of this.roleHierarchy) {
            hierarchy[parentRole] = Array.from(childRoles);
        }
        
        return hierarchy;
    }

    // Utility Methods
    getAllRoles() {
        return Array.from(this.roles.values());
    }

    getAllPermissions() {
        return Array.from(this.permissions.values());
    }

    getPermissionsByCategory() {
        const categories = {};
        
        for (const permission of this.permissions.values()) {
            if (!categories[permission.category]) {
                categories[permission.category] = [];
            }
            categories[permission.category].push(permission);
        }
        
        return categories;
    }

    getUserRoles(userId) {
        const userRoleIds = this.userRoles.get(userId) || [this.config.defaultRole];
        return userRoleIds.map(roleId => this.roles.get(roleId)).filter(Boolean);
    }

    getRoleLevel(userId) {
        const userRoles = this.getUserRoles(userId);
        return Math.max(...userRoles.map(role => role.level), 0);
    }

    canAccessRole(currentUserLevel, targetRoleLevel) {
        // Users can only assign roles with equal or lower level
        return currentUserLevel >= targetRoleLevel;
    }

    // Audit and Reporting
    getAuditLog(filters = {}) {
        let logs = [...this.auditLog];
        
        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }
        
        if (filters.roleId) {
            logs = logs.filter(log => log.roleId === filters.roleId);
        }
        
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }
        
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getRoleUsageStats() {
        const stats = {};
        
        for (const [userId, userRoles] of this.userRoles) {
            for (const roleId of userRoles) {
                if (!stats[roleId]) {
                    stats[roleId] = {
                        role: this.roles.get(roleId),
                        userCount: 0,
                        users: []
                    };
                }
                stats[roleId].userCount++;
                stats[roleId].users.push(userId);
            }
        }
        
        return stats;
    }

    getPermissionUsageStats() {
        const stats = {};
        
        for (const [userId, userRoles] of this.userRoles) {
            const userPermissions = this.getUserPermissions(userId);
            for (const permission of userPermissions) {
                if (!stats[permission]) {
                    stats[permission] = {
                        permission: this.permissions.get(permission),
                        userCount: 0,
                        users: []
                    };
                }
                stats[permission].userCount++;
                if (!stats[permission].users.includes(userId)) {
                    stats[permission].users.push(userId);
                }
            }
        }
        
        return stats;
    }

    // Export/Import
    exportRoles() {
        return {
            roles: Array.from(this.roles.entries()),
            permissions: Array.from(this.permissions.entries()),
            userRoles: Array.from(this.userRoles.entries()),
            exportedAt: new Date().toISOString()
        };
    }

    importRoles(data) {
        if (!data.roles || !data.permissions) {
            throw new Error('Invalid import data');
        }
        
        // Import permissions first
        for (const [id, permission] of data.permissions) {
            this.permissions.set(id, permission);
        }
        
        // Import roles
        for (const [id, role] of data.roles) {
            this.roles.set(id, role);
        }
        
        // Import user roles if provided
        if (data.userRoles) {
            for (const [userId, roles] of data.userRoles) {
                this.userRoles.set(userId, roles);
            }
        }
        
        this.buildRoleHierarchy();
        
        console.log(`✅ Imported ${data.roles.length} roles and ${data.permissions.length} permissions`);
    }
}

module.exports = { UserRoles };