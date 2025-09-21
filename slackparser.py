import requests
import json
from datetime import datetime, timedelta
import time
import os
from dotenv import load_dotenv
from cerebras.cloud.sdk import Cerebras

class SlackUnreadMentionsSummarizer:
    def __init__(self, user_token, cerebras_api_key):
        """
        Initialize the Slack unread mentions summarizer.
        
        Args:
            user_token (str): Slack user OAuth token (starts with 'xoxp-')
            cerebras_api_key (str): Cerebras API key
        """
        self.user_token = user_token
        self.base_url = "https://slack.com/api"
        self.headers = {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json"
        }
        
        # Initialize Cerebras client
        self.cerebras = Cerebras(api_key=cerebras_api_key)
    
    def get_user_id(self):
        """Get the authenticated user's ID."""
        response = requests.get(f"{self.base_url}/auth.test", headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                return data.get("user_id")
        return None
    
    def get_channels_with_unreads(self):
        """Get channels that have unread messages."""
        response = requests.get(
            f"{self.base_url}/users.conversations",
            headers=self.headers,
            params={
                "types": "public_channel,private_channel,mpim,im",
                "exclude_archived": True,
                "limit": 1000
            }
        )
        
        channels_with_unreads = []
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                for channel in data.get("channels", []):
                    # Check if channel has unread messages
                    if channel.get("unread_count", 0) > 0:
                        channels_with_unreads.append({
                            "id": channel["id"],
                            "name": channel.get("name", "DM"),
                            "unread_count": channel.get("unread_count", 0),
                            "last_read": channel.get("last_read", "0"),
                            "is_channel": channel.get("is_channel", False),
                            "is_group": channel.get("is_group", False),
                            "is_im": channel.get("is_im", False)
                        })
        
        return channels_with_unreads
    
    def get_unread_mentions_from_channel(self, channel_id, last_read_ts="0"):
        """
        Get unread mentions from a specific channel.
        
        Args:
            channel_id (str): Slack channel ID
            last_read_ts (str): Timestamp of last read message
        
        Returns:
            list: List of unread mention objects
        """
        user_id = self.get_user_id()
        if not user_id:
            return []
        
        # Get user groups for group mention detection
        user_groups = self.get_user_groups()
        
        mentions = []
        cursor = None
        
        # Convert last_read_ts to float for comparison
        last_read_float = float(last_read_ts) if last_read_ts != "0" else 0
        
        while True:
            params = {
                "channel": channel_id,
                "oldest": last_read_ts,  # Only get messages after last read
                "limit": 200,
                "inclusive": False  # Don't include the last read message
            }
            
            if cursor:
                params["cursor"] = cursor
            
            response = requests.get(
                f"{self.base_url}/conversations.history",
                headers=self.headers,
                params=params
            )
            
            if response.status_code != 200:
                break
                
            data = response.json()
            if not data.get("ok"):
                break
            
            # Filter messages that mention the user and are actually unread
            for message in data.get("messages", []):
                message_ts = float(message.get("ts", 0))
                
                # Skip if message is not newer than last read
                if message_ts <= last_read_float:
                    continue
                
                text = message.get("text", "")
                is_mention = False
                mention_type = "direct"
                
                # Check for direct mention
                if f"<@{user_id}>" in text:
                    is_mention = True
                    mention_type = "direct"
                
                # Check for group mentions
                elif "<!everyone>" in text:
                    is_mention = True
                    mention_type = "everyone"
                elif "<!channel>" in text:
                    is_mention = True
                    mention_type = "channel"
                elif "<!here>" in text:
                    is_mention = True
                    mention_type = "here"
                else:
                    # Check user groups
                    for group in user_groups:
                        if f"<!subteam^{group['id']}>" in text:
                            is_mention = True
                            mention_type = f"group_{group['handle']}"
                            break
                
                if is_mention:
                    mention_obj = self.format_mention(message, channel_id)
                    mention_obj["mention_type"] = mention_type
                    mentions.append(mention_obj)
            
            # Check if there are more messages
            if not data.get("has_more"):
                break
                
            cursor = data.get("response_metadata", {}).get("next_cursor")
            if not cursor:
                break
            
            # Rate limiting
            time.sleep(0.5)
        
        return mentions
    
    def get_user_groups(self):
        """Get list of user groups (subteams) that the authenticated user belongs to."""
        response = requests.get(f"{self.base_url}/usergroups.list", headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                user_id = self.get_user_id()
                user_groups = []
                
                # Check which groups the user belongs to
                for group in data.get("usergroups", []):
                    # Get group members
                    group_response = requests.get(
                        f"{self.base_url}/usergroups.users.list",
                        headers=self.headers,
                        params={"usergroup": group["id"]}
                    )
                    
                    if group_response.status_code == 200:
                        group_data = group_response.json()
                        if group_data.get("ok"):
                            members = group_data.get("users", [])
                            if user_id in members:
                                user_groups.append({
                                    "id": group["id"],
                                    "name": group.get("name"),
                                    "handle": group.get("handle")
                                })
                    
                    # Rate limiting
                    time.sleep(0.3)
                
                return user_groups
        
        return []
    
    def format_mention(self, message, channel_id):
        """Format a message into a mention object."""
        return {
            "timestamp": message.get("ts"),
            "date": datetime.fromtimestamp(float(message.get("ts", 0))).strftime("%Y-%m-%d %H:%M:%S"),
            "user": message.get("user"),
            "text": message.get("text"),
            "channel_id": channel_id,
            "message_type": message.get("type", "message")
        }
    
    def get_user_info(self, user_id):
        """Get user information."""
        response = requests.get(
            f"{self.base_url}/users.info",
            headers=self.headers,
            params={"user": user_id}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                user = data.get("user", {})
                return {
                    "name": user.get("name"),
                    "real_name": user.get("real_name"),
                    "display_name": user.get("profile", {}).get("display_name")
                }
        return {"name": user_id, "real_name": "Unknown", "display_name": "Unknown"}
    
    def get_channel_info(self, channel_id):
        """Get channel information."""
        response = requests.get(
            f"{self.base_url}/conversations.info",
            headers=self.headers,
            params={"channel": channel_id}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                channel = data.get("channel", {})
                return {
                    "name": channel.get("name", "DM"),
                    "is_channel": channel.get("is_channel", False),
                    "is_group": channel.get("is_group", False),
                    "is_im": channel.get("is_im", False)
                }
        return {"name": "Unknown", "is_channel": False, "is_group": False, "is_im": False}
    
    def get_all_unread_mentions(self):
        """Get all unread mentions across all channels."""
        print("📬 Fetching channels with unread messages...")
        channels_with_unreads = self.get_channels_with_unreads()
        
        if not channels_with_unreads:
            print("✅ No channels with unread messages found!")
            return []
        
        print(f"📊 Found {len(channels_with_unreads)} channels with unread messages")
        
        all_unread_mentions = []
        
        for channel in channels_with_unreads:
            print(f"🔍 Checking #{channel['name']} for mentions...")
            
            mentions = self.get_unread_mentions_from_channel(
                channel["id"], 
                channel["last_read"]
            )
            
            if mentions:
                # Enrich mentions with channel info
                channel_info = self.get_channel_info(channel["id"])
                for mention in mentions:
                    mention["channel_name"] = channel_info["name"]
                    mention["channel_type"] = (
                        "DM" if channel_info["is_im"] else
                        "Group" if channel_info["is_group"] else
                        "Channel"
                    )
                    
                    # Get user info
                    if mention["user"]:
                        user_info = self.get_user_info(mention["user"])
                        mention["user_name"] = user_info["real_name"] or user_info["name"]
                
                all_unread_mentions.extend(mentions)
                print(f"  📌 Found {len(mentions)} unread mentions")
            else:
                print(f"  ✅ No mentions found")
        
        # Sort by timestamp (newest first)
        all_unread_mentions.sort(key=lambda x: float(x.get('timestamp', 0)), reverse=True)
        
        return all_unread_mentions
    
    def generate_summary(self, mentions, max_mentions=20):
        """
        Generate an AI summary of unread mentions using Cerebras.
        
        Args:
            mentions (list): List of mention objects
            max_mentions (int): Maximum number of mentions to include in summary
        
        Returns:
            dict: Summary with different sections
        """
        if not mentions:
            return {
                "summary": "🎉 No unread mentions! You're all caught up!",
                "priority_actions": [],
                "mention_breakdown": {},
                "total_count": 0
            }
        
        # Limit mentions for API efficiency
        limited_mentions = mentions[:max_mentions]
        
        # Prepare data for AI analysis
        mention_data = []
        for mention in limited_mentions:
            mention_data.append({
                "date": mention["date"],
                "from": mention.get("user_name", "Unknown"),
                "channel": mention.get("channel_name", "Unknown"),
                "type": mention["mention_type"],
                "message": mention["text"][:500]  # Limit message length
            })
        
        # Create prompt for Cerebras
        prompt = f"""Analyze these {len(mention_data)} unread Slack mentions and provide a concise summary:

{json.dumps(mention_data, indent=2)}

Please provide:
1. A brief overall summary of what needs attention
2. Top 3-5 priority actions or responses needed
3. Any patterns or themes in the mentions
4. Urgency assessment (high/medium/low)

Keep the response concise and actionable. Focus on what the user should do next."""

        try:
            # Generate summary using Cerebras
            response = self.cerebras.chat.completions.create(
                model="llama3.1-8b",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that summarizes Slack mentions to help users prioritize their responses. Be concise, actionable, and focus on what matters most."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            ai_summary = response.choices[0].message.content
            
        except Exception as e:
            ai_summary = f"Error generating AI summary: {str(e)}"
        
        # Generate breakdown by mention type
        mention_breakdown = {}
        for mention in mentions:
            mtype = mention["mention_type"]
            if mtype not in mention_breakdown:
                mention_breakdown[mtype] = 0
            mention_breakdown[mtype] += 1
        
        return {
            "ai_summary": ai_summary,
            "total_count": len(mentions),
            "analyzed_count": len(limited_mentions),
            "mention_breakdown": mention_breakdown,
            "recent_mentions": limited_mentions[:5]  # Show 5 most recent
        }
    
    def create_mentions_json_report(self, filename="slack_mentions_report.json"):
        """
        Create a JSON report containing all unread mentions and their AI summary.
        
        Args:
            filename (str): Output filename for the JSON report
            
        Returns:
            dict: Complete report data
        """
        print("🚀 Starting unread mentions analysis...")
        
        # Get all unread mentions
        mentions = self.get_all_unread_mentions()
        
        if not mentions:
            # Add a dummy entry when no unreads found
            dummy_mention = {
                "timestamp": str(datetime.now().timestamp()),
                "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "user": "system",
                "user_name": "System",
                "text": "Congratulations! No unread mentions found. You're all caught up!",
                "channel_id": "system",
                "channel_name": "system",
                "channel_type": "System",
                "mention_type": "none",
                "message_type": "system"
            }
            
            report_data = {
                "generated_at": datetime.now().isoformat(),
                "total_mentions": 0,
                "actual_mentions_count": 0,
                "mentions": [dummy_mention],
                "summary": {
                    "ai_summary": "Great news! No unread mentions found. You're all caught up!",
                    "total_count": 0,
                    "mention_breakdown": {},
                    "priority_level": "none",
                    "key_actions": ["Enjoy your free time!", "Consider catching up on other tasks"]
                }
            }
        else:
            print(f"\n📊 Analysis complete! Found {len(mentions)} unread mentions")
            
            # Generate AI summary
            print("🤖 Generating AI summary with Cerebras...")
            summary = self.generate_summary(mentions)
            
            # Structure the complete report
            report_data = {
                "generated_at": datetime.now().isoformat(),
                "total_mentions": len(mentions),
                "actual_mentions_count": len(mentions),
                "mentions": mentions,
                "summary": summary
            }
        
        # Save to JSON file with UTF-8 encoding to handle any special characters
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Complete mentions report saved to '{filename}'")
        return report_data

# Example usage
def main():
    # Load environment variables from googleAPIkey.env
    load_dotenv('googleAPIkey.env')
    
    # Configuration
    USER_TOKEN = "xoxp-9438563920497-9548844215205-9552884142565-b3c382c4897d38464da5eb6a004f9425"  # Replace with your actual Slack token
    CEREBRAS_API_KEY = os.getenv('CEREBRAS_API_KEY')
    
    if not CEREBRAS_API_KEY:
        print("❌ Error: CEREBRAS_API_KEY not found in googleAPIkey.env")
        print("Please add CEREBRAS_API_KEY=your-api-key to your googleAPIkey.env file")
        return
    
    # Initialize the summarizer
    summarizer = SlackUnreadMentionsSummarizer(USER_TOKEN, CEREBRAS_API_KEY)
    
    # Generate comprehensive JSON report
    report = summarizer.create_mentions_json_report("slack_mentions_report.json")
    
    # Display summary in console
    if report["total_mentions"] > 0:
        summary = report["summary"]
        
        print("\n" + "="*60)
        print("📋 UNREAD MENTIONS SUMMARY")
        print("="*60)
        
        print(f"\n🤖 AI Analysis:")
        print(summary["ai_summary"])
        
        print(f"\n📊 Statistics:")
        print(f"Total unread mentions: {summary['total_count']}")
        if summary.get('analyzed_count'):
            print(f"Analyzed in detail: {summary['analyzed_count']}")
        
        print(f"\n📈 Breakdown by type:")
        for mtype, count in summary["mention_breakdown"].items():
            print(f"  {mtype}: {count}")
        
        if summary.get("recent_mentions"):
            print(f"\n🔥 Most Recent Mentions:")
            for i, mention in enumerate(summary["recent_mentions"][:5], 1):
                print(f"{i}. {mention['date']} - {mention.get('user_name', 'Unknown')} in #{mention.get('channel_name', 'Unknown')}")
                print(f"   [{mention['mention_type']}] {mention['text'][:100]}...")
                print()
        
        print(f"\n📄 Full report with {len(report['mentions'])} mentions saved to JSON file")
    else:
        print("\n🎉 Great news! No unread mentions found. You're all caught up!")

if __name__ == "__main__":
    main()