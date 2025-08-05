import requests, threading
from user_agents import parse as parse_user_agent
from agent.models import Profile


def get_client_ip(request):
    ip = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    if ip.startswith("127.") or ip == "::1":
        try:
            ip = requests.get("https://api.ipify.org?format=json", timeout=2).json()["ip"]
        except Exception as e:
            print(f"Error fetching IP address: {e}")
    return ip


def background_visitor_logger(request):
    def fetch_and_save_data():
        ip = get_client_ip(request)

        if not ip:
            return
        
        if Profile.objects.filter(ip_address=ip).exists():
            return

        profile, created = Profile.objects.get_or_create(ip_address=ip)
        
        if created:
            user_agent_str = request.META.get('HTTP_USER_AGENT', '')
            user_agent = parse_user_agent(user_agent_str)
            referer = request.META.get('HTTP_REFERER', '')
            language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')

            try:
                ipapi_response = requests.get(f"https://ipapi.co/{ip}/json/", timeout=5)
                ip_api_response = requests.get(f"http://ip-api.com/json/{ip}?fields=continent,isp,mobile,proxy,hosting", timeout=5)
                data = ipapi_response.json()
                other = ip_api_response.json()
            except Exception as e:
                print(f"Error fetching IP data: {e}")
                other, data = {}, {}
                
            profile.user = request.user if request.user.is_authenticated else None
            profile.email = getattr(request.user, 'email', None) if request.user.is_authenticated else None
            profile.username = getattr(request.user, 'username', None) if request.user.is_authenticated else None
            profile.first_name = getattr(request.user, 'first_name', None) if request.user.is_authenticated else None
            profile.last_name = getattr(request.user, 'last_name', None) if request.user.is_authenticated else None
            profile.city = data.get('city')
            profile.region = data.get('region')
            profile.country = data.get('country_name')
            profile.continent = other.get('continent')
            profile.zip_code = data.get('postal')
            profile.latitude = data.get('latitude')
            profile.longitude = data.get('longitude')
            profile.timezone = data.get('timezone')
            profile.currency = data.get('currency_name')
            profile.isp = other.get('isp')
            profile.org = data.get('org')
            profile.as_name = data.get('asn')
            profile.mobile = other.get('mobile', False)
            profile.proxy = other.get('proxy', False)
            profile.hosting = other.get('hosting', False)
            profile.user_agent = user_agent_str
            profile.browser = user_agent.browser.family
            profile.browser_version = user_agent.browser.version_string
            profile.os = user_agent.os.family
            profile.os_version = user_agent.os.version_string
            profile.device_type = (
                'Mobile' if user_agent.is_mobile else
                'Tablet' if user_agent.is_tablet else
                'PC' if user_agent.is_pc else
                'Bot' if user_agent.is_bot else 'Other'
            )
            profile.is_bot = user_agent.is_bot
            profile.referer = referer
            profile.language = language
            profile.save()
            
    threading.Thread(target=fetch_and_save_data).start()
        