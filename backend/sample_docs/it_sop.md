# ACME Corporation — IT Security & Operations Standard Operating Procedure
## Document ID: IT-SOP-001 | Version 2.4 | Last Updated: March 2025
## Owner: Information Technology Department | Classification: Internal

---

## 1. PURPOSE AND SCOPE

This Standard Operating Procedure (SOP) establishes IT security standards, acceptable use policies, and operational procedures for all ACME Corporation employees, contractors, and third-party vendors who access company systems, networks, or data. Compliance with this SOP is mandatory.

Non-compliance may result in disciplinary action up to and including termination, and potential legal liability.

---

## 2. ACCOUNT AND ACCESS MANAGEMENT

### 2.1 User Account Provisioning
New employee accounts are created by the IT Help Desk within 24 hours of receiving an approved Access Request Form (ARF) from HR. The ARF must be signed by the employee's department head.

All new accounts are created with the principle of least privilege — users receive only the minimum permissions necessary to perform their job functions.

### 2.2 Password Policy
All user accounts must comply with the following password requirements:
- Minimum length: 14 characters
- Must include: uppercase letters, lowercase letters, numbers, and at least one special character (!@#\$%^&*)
- Cannot reuse the last 12 passwords
- Must be changed every 90 days
- Cannot contain the user's name, username, or dictionary words

Password resets can be requested via the IT Self-Service Portal at https://itportal.acme.com or by calling the Help Desk at ext. 5000.

### 2.3 Multi-Factor Authentication (MFA)
MFA is required for:
- All VPN connections
- Microsoft 365 and cloud applications
- Administrative accounts
- Access to financial systems (ERP, banking portals)
- Remote desktop connections

Approved MFA methods: Microsoft Authenticator app (preferred), hardware tokens (for admin accounts). SMS-based OTP is not an approved method due to SIM-swapping risks.

### 2.4 Access Reviews
IT conducts quarterly access reviews for all privileged accounts and semi-annual reviews for standard user accounts. Managers must certify their team's access rights during review periods. Uncertified accounts will be automatically disabled.

### 2.5 Account Termination
Upon employee termination or resignation, HR must notify IT via the Offboarding Ticket at least 24 hours before the last day. IT will:
1. Disable the account on the last working day at 5:00 PM
2. Revoke VPN and remote access immediately upon notification
3. Archive email and data for 90 days per data retention policy
4. Remove access to all systems within 24 hours of termination

---

## 3. DEVICE AND ENDPOINT SECURITY

### 3.1 Approved Devices
Only ACME-issued and IT-managed devices may be used to access company systems and data. Personal devices (BYOD) are NOT permitted for accessing corporate email, files, or applications unless enrolled in the Mobile Device Management (MDM) system.

To enroll a personal mobile device in MDM, submit a BYOD Enrollment Request via the IT Self-Service Portal.

### 3.2 Encryption Requirements
- All laptops and desktops must have full-disk encryption enabled (BitLocker for Windows, FileVault for Mac)
- USB drives must use hardware-encrypted devices approved by IT (SanDisk SecureAccess or equivalent)
- Sensitive data must never be stored on personal cloud storage (personal Google Drive, Dropbox, etc.)

### 3.3 Antivirus and Patch Management
- CrowdStrike Falcon is deployed on all endpoints and must not be disabled
- Critical security patches are applied automatically within 72 hours of release
- Non-critical patches are applied during the monthly patching window (3rd Tuesday of each month, 10 PM–2 AM EST)
- Employees must not defer reboots required for patch installation beyond 48 hours

### 3.4 Screen Lock and Physical Security
- Screens must auto-lock after 10 minutes of inactivity (enforced via Group Policy)
- Employees must manually lock screens (Windows+L) when leaving their workstation unattended
- Laptops must not be left unattended in public spaces (airports, coffee shops, hotels)
- Lost or stolen devices must be reported to IT within 1 hour of discovery

---

## 4. NETWORK AND VPN USAGE

### 4.1 VPN Policy
All remote access to ACME internal systems must use the company VPN (Cisco AnyConnect). VPN credentials use the same Active Directory username/password with MFA required.

VPN Split Tunneling is disabled — all internet traffic is routed through the corporate network when connected to VPN.

### 4.2 Wireless Network
In the office, employees should use the "ACME-Corporate" WiFi network. Visitors should use the "ACME-Guest" network (isolated from corporate resources). Connecting to open/public WiFi is discouraged; use the VPN if connecting from untrusted networks.

### 4.3 Prohibited Network Activities
The following activities are strictly prohibited on the corporate network:
- Port scanning or network reconnaissance tools
- Bypassing firewall or proxy controls (VPNs, Tor, proxy bypass tools)
- Connecting unauthorized network devices (rogue access points, switches, hubs)
- Packet capturing or network sniffing without written IT approval

---

## 5. DATA CLASSIFICATION AND HANDLING

### 5.1 Data Classification Levels
| Level | Examples | Handling |
|-------|----------|---------|
| Public | Press releases, marketing materials | No restrictions |
| Internal | Policies, procedures, org charts | ACME network/devices only |
| Confidential | Financial data, employee records, contracts | Encrypted, need-to-know access |
| Restricted | Trade secrets, PII, payment card data | Strict controls, logged access |

### 5.2 Data Storage Rules
- Confidential and Restricted data must be stored on company-approved servers or SharePoint
- Local storage on laptops for these data types requires manager approval
- Data must NOT be stored on personal email, personal cloud, or USB drives (unless encrypted)

### 5.3 Data Retention
Data must be retained according to the Data Retention Schedule (DRS-001):
- Employee records: 7 years after termination
- Financial records: 7 years
- Customer contracts: 10 years
- Email: 3 years (archived automatically)

---

## 6. INCIDENT REPORTING

### 6.1 Security Incidents
Employees MUST report the following immediately to the IT Security team:
- Suspected phishing emails (forward to phishing@acme.com)
- Malware or ransomware symptoms (unusual file encryption, pop-ups)
- Unauthorized access to accounts or systems
- Lost or stolen devices
- Accidental disclosure of sensitive data

### 6.2 Reporting Channels
- Urgent (active incident): Call IT Security Hotline: ext. 5911 (24/7)
- Non-urgent: Submit Security Incident Report at https://security.acme.com/report
- Anonymous reporting: Ethics Hotline 1-800-555-ETHICS

### 6.3 Incident Response SLAs
| Severity | Response Time | Examples |
|----------|--------------|---------|
| Critical | 15 minutes | Ransomware, data breach, system compromise |
| High | 1 hour | Malware, account takeover, data exposure |
| Medium | 4 hours | Phishing attempts, policy violations |
| Low | 24 hours | General IT security questions |

---

## 7. SOFTWARE AND APPLICATION USAGE

### 7.1 Approved Software
Only software approved by IT and listed in the Software Catalog (https://itportal.acme.com/catalog) may be installed on company devices. To request new software, submit a Software Request via the IT Portal.

### 7.2 Prohibited Software
The following categories of software are strictly prohibited:
- Peer-to-peer file sharing applications (BitTorrent, etc.)
- Unauthorized remote desktop or access tools
- Hacking or penetration testing tools (without explicit IT Security approval)
- Cryptocurrency mining software
- Personal antivirus software (conflicts with CrowdStrike Falcon)

### 7.3 AI Tools Usage Policy
The use of external AI tools (ChatGPT, Bard, Copilot) is permitted for general productivity tasks. HOWEVER, employees must NEVER input:
- Customer PII or customer data of any kind
- Financial data, trade secrets, or proprietary code
- Employee personal information

Approved AI tools: Microsoft Copilot (M365 integrated) for internal productivity.

---

## 8. BACKUP AND DISASTER RECOVERY

### 8.1 Backup Schedule
- Critical systems: Real-time replication + daily snapshots (retained 30 days)
- Standard servers: Daily incremental, weekly full (retained 60 days)
- Employee workstations: Weekly backup via CrashPlan (enabled by default)

### 8.2 Recovery Time Objectives
| System | RTO | RPO |
|--------|-----|-----|
| Core business systems | 4 hours | 1 hour |
| Email | 2 hours | 15 minutes |
| File servers | 8 hours | 24 hours |
| Development systems | 24 hours | 24 hours |

---

## 9. HELP DESK AND SUPPORT

- IT Help Desk: ithelpdesk@acme.com | ext. 5000 (Mon–Fri, 7 AM–8 PM EST)
- IT Emergency/After-hours: ext. 5911
- Self-Service Portal: https://itportal.acme.com
- VPN Issues: vpnsupport@acme.com
