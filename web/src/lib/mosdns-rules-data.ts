export interface Rule {
  type: string;
  mode: string;
  content: string;
}

export interface RuleCategory {
  id: string;
  label: string;
  count: number;
  rules: Rule[];
}

const d = (content: string, mode = "domain"): Rule => ({ type: "whitelist", mode, content });

export const ruleCategories: RuleCategory[] = [
  {
    id: "whitelist",
    label: "直连",
    count: 101,
    rules: [
      d("localhost.pan.baidu.com", "full"),
      d("alibabachengdun.com"),
      d("wocloud.cn"),
      d("wo.cn"),
      d("10086.cn"),
      d("www.dingtalkcs.com", "full"),
      d("vegslb.com"),
      d("sealaly.net"),
      d("tracker.m-team.io"),
      d("tracker.hdsky.me"),
      d("steamcontent.com"),
      d("6.ipw.cn", "full"),
      d("test6.ustc.edu.cn", "full"),
      d("apiauth.quickconnect.to", "full"),
      d("nkvod.com"),
      d("philma.fun"),
      d("mbjlkg.lol"),
      d("huacloud.xyz"),
      d("rfp4ucx.xyz"),
      d("myip.ipip.net"),
      d("nexconvert.com"),
      d("heartbeat.belkin.com"),
      d("msftconnecttest.com"),
      d("space.bilibili.com"),
      d("b23.tv"),
      d("msedge.com"),
    ],
  },
  {
    id: "blocklist",
    label: "拦截",
    count: 43,
    rules: [
      "msmp.abchina.com.cn",
      "stun.l.google.com",
      "trace-server.prod-clustered.bugs.firebat.prime-video.amazon.dev",
      "xmbc.highrez.co.uk",
      "route-stats.d.meituan.net",
      "ntp.nasa.gov",
      "maplocatesdksnapshot.d.meituan.net",
      "pti.store.microsoft.com",
    ].map((content) => ({ type: "blocklist", mode: "full", content })),
  },
  {
    id: "greylist",
    label: "代理",
    count: 70,
    rules: [
      { type: "greylist", mode: "full", content: "in.appcenter.ms" },
      { type: "greylist", mode: "full", content: "onedrive.live.com" },
      { type: "greylist", mode: "full", content: "www.metatrader5.com" },
      { type: "greylist", mode: "domain", content: "google.cn" },
      { type: "greylist", mode: "domain", content: "piaohua.com" },
      { type: "greylist", mode: "domain", content: "4d4y.com" },
    ],
  },
  {
    id: "ddnslist",
    label: "DDNS域名",
    count: 4,
    rules: [
      "hello.example.invalid",
      "openlist.example.invalid",
      "example.invalid",
      "wuwan.de",
    ].map((content) => ({ type: "ddnslist", mode: "默认", content })),
  },
  {
    id: "direct_ip",
    label: "直连IP",
    count: 1,
    rules: [{ type: "direct_ip", mode: "默认", content: "17.0.0.0/8" }],
  },
  {
    id: "rewrite",
    label: "重定向",
    count: 2,
    rules: [
      { type: "rewrite", mode: "full", content: "xnerd.example.invalid → 203.0.113.10" },
      { type: "rewrite", mode: "full", content: "xdmit.example.invalid → 198.51.100.10" },
    ],
  },
];

export interface SubscriptionRule {
  name: string;
  url: string;
  ruleCount: string;
  updatedAt: string;
  enabled: boolean;
}

export const adblockLists: SubscriptionRule[] = [
  { name: "httpdns", url: "https://raw.githubusercontent.com/yyysuo/firetv/refs/heads/master/httpdns.txt", ruleCount: "64", updatedAt: "2025/12/19 16:33:45", enabled: true },
  { name: "pcdn1", url: "https://thhbdd.github.io/Block-pcdn-domains/ban.txt", ruleCount: "20", updatedAt: "2025/12/19 16:33:45", enabled: true },
  { name: "pcdn2", url: "https://cdn.jsdelivr.net/gh/susetao/PCDNFilter-CHN-@main/PCDNFilter.txt", ruleCount: "33", updatedAt: "2025/12/19 16:33:45", enabled: true },
];

export interface RoutingRule extends SubscriptionRule {
  typeLabel: string;
  typeKey: string;
  color: string;
}

export const routingTypes = [
  { key: "all", label: "全部" },
  { key: "geositecn", label: "中国域名 (geositecn)" },
  { key: "geositenocn", label: "非中国域名 (geositenocn)" },
  { key: "geoipcn", label: "中国IP (geoipcn)" },
  { key: "!cn@cn", label: "国内加速域名 (!cn@cn)" },
  { key: "cn@!cn", label: "国外专属域名 (cn@!cn)" },
];

export const routingLists: RoutingRule[] = [
  { name: "geosite_cn", typeLabel: "中国域名 (geositecn)", typeKey: "geositecn", color: "blue", url: "https://github.com/MetaCubeX/meta-rules-dat/raw/sing/geo/geosite/cn.srs", ruleCount: "117,508", updatedAt: "2025/12/19 16:33:02", enabled: true },
  { name: "geosite_no_cn", typeLabel: "非中国域名 (geositenocn)", typeKey: "geositenocn", color: "purple", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geosite/geolocation-!cn.srs", ruleCount: "26,329", updatedAt: "2025/12/19 16:33:09", enabled: true },
  { name: "geoip_cn", typeLabel: "中国IP (geoipcn)", typeKey: "geoipcn", color: "green", url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/sing/geo/geoip/cn.srs", ruleCount: "19,543", updatedAt: "2025/12/19 16:32:54", enabled: true },
  { name: "cuscn", typeLabel: "国内加速域名 (!cn@cn)", typeKey: "!cn@cn", color: "orange", url: "https://raw.githubusercontent.com/nekolsd/sing-geosite/refs/heads/rule-set/geosite-geolocation-!cn@cn.srs", ruleCount: "1,089", updatedAt: "2025/12/19 16:32:42", enabled: true },
  { name: "cusnocn", typeLabel: "国外专属域名 (cn@!cn)", typeKey: "cn@!cn", color: "pink", url: "https://raw.githubusercontent.com/nekolsd/sing-geosite/refs/heads/rule-set/geosite-cn@!cn.srs", ruleCount: "262", updatedAt: "2025/12/19 16:32:48", enabled: true },
  { name: "tiktok", typeLabel: "国外专属域名 (cn@!cn)", typeKey: "cn@!cn", color: "pink", url: "https://raw.githubusercontent.com/nekolsd/sing-geosite/refs/heads/rule-set/geosite-tiktok.srs", ruleCount: "30", updatedAt: "2025/12/19 16:33:29", enabled: true },
];
