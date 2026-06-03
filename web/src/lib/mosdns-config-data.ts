export const configYaml = `log:
  level: warn
  file: "/root/.msm/configs/logs/mosdns.log"


#跟web ui绑定，不要修改此端口
api:
  http: "0.0.0.0:9099"


#子配置，不要调整顺序
include:
  - "sub_config/adguard.yaml"               #Adguard插件
  - "sub_config/domain_output.yaml"         #域名规则生成输出插件定义
  - "sub_config/rule_set.yaml"              #数据插件定义
  - "sub_config/cache.yaml"                 #缓存插件定义
  - "sub_config/forward_local.yaml"         #带过期缓存的内部使用国内dns服务器
  - "sub_config/forward_nocn.yaml"          #带过期缓存的内部使用国外dns服务器
  - "sub_config/forward_nocn_ecs.yaml"      #带过期缓存的内部使用国外dns服务器（带ecs）节点使用
  - "sub_config/forward_1.yaml"             #使用前面定义的内部dns服务器定义序列 1代表调用层级 大的调用小的
  - "sub_config/con_match.yaml"             #定义序列对域名列表进行并发匹配生成黑洞IP
  - "sub_config/switch.yaml"                #切换开关定义
  - "sub_config/not_in_list_ipmatch.yaml"   #列表外的域名获取上游dns响应结果后进行ip对比
  - "sub_config/not_in_list_leak_v4.yaml"   #列表外的域名泄露版的处理逻辑
  - "sub_config/not_in_list_leak_v6.yaml"   #列表外的域名泄露版的处理逻辑`;

export const fileTree = {
  folders: ["adguard", "cache", "gen", "genblank", "rule", "srs", "sub_config", "unpack", "webinfo"],
  files: [
    ".msm-mosdns-template-manifest.json",
    ".msm-mosdns-template-version",
    "audit_settings.json",
    "client_ip.txt",
    "config_overrides.json",
    "config.yaml",
    "upstream_overrides.json",
  ],
};
