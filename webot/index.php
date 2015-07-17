<?php

define("TOKEN", "<% your wechat app token here %>");
$wechatObj = new wechatCallbackapiTest();
$wechatObj->responseMsg();

/* via http://chenall.net/post/cs_smtp/ */
class cs_smtp
{
    private $CRLF = "\r\n";
    private $from;
    private $smtp = null;
    private $attach = array();
    public $debug = true;
    public $errstr = '';

    function __construct($host='smtp.qq.com',$port = 25) {
        if (empty($host))
            die('SMTP服务器未指定!');
        $this->smtp = fsockopen($host,$port,$errno,$errstr,5);
        if (empty($this->smtp))
        {
            $this->errstr = '错误'.$errno.':'.$errstr;
            return;
        }
        $this->smtp_log(fread($this->smtp, 515));
        if (intval($this->smtp_cmd('EHLO '.$host)) != 250 && intval($this->smtp_cmd('HELO '.$host)))
            return $this->errstr = '服务器不支持！';
        $this->errstr = '';
    }

    private function AttachURL($url,$name)
    {
        $info = parse_url($url);
        isset($info['port']) || $info['port'] = 80;
        isset($info['path']) || $info['path'] = '/';
        isset($info['query']) || $info['query'] = '';
        $down = fsockopen($info['host'],$info['port'],$errno,$errstr,5);
        if (!$down)
            return false;
        $out = "GET ".$info['path'].'?'.$info['query']." HTTP/1.1\r\n";
        $out .="Host: ".$info['host']."\r\n";
        $out .= "Connection: Close\r\n\r\n";
        fwrite($down, $out);
        $filesize = 0;
        while (!feof($down)) {
            $a = fgets($down,515);
            if ($a == "\r\n")
                break;
            $a = explode(':',$a);
            if (strcasecmp($a[0],'Content-Length') == 0)
                $filesize = intval($a[1]);
        }
        $sendsize = 0;
        echo "TotalSize: ".$filesize."\r\n";
        $i = 0;
        while (!feof($down)) {
            $data = fread($down,0x2000);
            $sendsize += strlen($data);
            if ($filesize)
            {
                echo "$i Send:".$sendsize."\r";
                ob_flush();
                flush();
            }
            ++$i;
            fwrite($this->smtp,chunk_split(base64_encode($data)));
        }
        echo "\r\n";
        fclose($down);
        return ($filesize>0)?$filesize==$sendsize:true;
    }

    function __destruct()
    {
        if ($this->smtp)
            $this->smtp_cmd('QUIT');//发送退出命令
    }

    private function smtp_log($msg)//即时输出调试使用
    {
        if ($this->debug == false)
            return;
        echo $msg."\r\n";
        ob_flush();
        flush();
    }

    function reset()
    {
        $this->attach = null;
        $this->smtp_cmd('RSET');
    }

    function smtp_cmd($msg)//SMTP命令发送和收收
    {
        fputs($this->smtp,$msg.$this->CRLF);
        $this->smtp_log('SEND:'. substr($msg,0,80));
        $res = fread($this->smtp, 515);
        $this->smtp_log($res);
        $this->errstr = $res;
        return $res;
    }

    function AddURL($url,$name)
    {
        $this->attach[$name] = $url;
    }

    function AddFile($file,$name = '')//添加文件附件
    {
        if (file_exists($file))
        {
            if (!empty($name))
                return $this->attach[$name] = $file;
            $fn = pathinfo($file);
            return $this->attach[$fn['basename']] = $file;
        }
        return false;
    }

    function send($to,$subject='',$body = '')
    {
        $this->smtp_cmd("MAIL FROM: <".$this->from.'>');
        $mailto = explode(',',$to);
        foreach($mailto as $email_to)
            $this->smtp_cmd("RCPT TO: <".$email_to.">");
        if (intval($this->smtp_cmd("DATA")) != 354)//正确的返回必须是354
            return false;
        fwrite($this->smtp,"To:$to\nFrom: ".$this->from."\nSubject: $subject\n");

        $boundary = uniqid("--BY_CHENALL_",true);
        $headers = "MIME-Version: 1.0".$this->CRLF;
        $headers .= "From: <".$this->from.">".$this->CRLF;
        $headers .= "Content-type: multipart/mixed; boundary= $boundary\n\n".$this->CRLF;//headers结束要至少两个换行
        fwrite($this->smtp,$headers);

        $msg = "--$boundary\nContent-Type: text/html;charset=\"ISO-8859-1\"\nContent-Transfer-Encoding: base64\n\n";
        $msg .= chunk_split(base64_encode($body));
        fwrite($this->smtp,$msg);
        $files = '';
        $errinfo = '';
        foreach($this->attach as $name=>$file)
        {
            $files .= $name;
            $msg = "--$boundary\n--$boundary\n";
            $msg .= "Content-Type: application/octet-stream; name=\"".$name."\"\n";
            $msg .= "Content-Disposition: attachment; filename=\"".$name."\"\n";
            $msg .= "Content-transfer-encoding: base64\n\n";
            fwrite($this->smtp,$msg);
            if (substr($file,4,1) == ':')//URL like http:///file://
            {
                if (!$this->AttachURL($file,$name))
                    $errinfo .= '文件下载错误:'.$name.",文件可能是错误的\r\n$file";
            }
            else
                fwrite($this->smtp,chunk_split(base64_encode(file_get_contents($file))));//使用BASE64编码，再用chunk_split大卸八块（每行76个字符）
        }
        if (!empty($errinfo))
        {
            $msg = "--$boundary\n--$boundary\n";
            $msg .= "Content-Type: application/octet-stream; name=Error.log\n";
            $msg .= "Content-Disposition: attachment; filename=Error.log\n";
            $msg .= "Content-transfer-encoding: base64\n\n";
            fwrite($this->smtp,$msg);
            fwrite($this->smtp,chunk_split(base64_encode($errinfo)));
        }
        return intval($this->smtp_cmd("--$boundary--\n\r\n.")) == 250;//结束DATA发送，服务器会返回执行结果，如果代码不是250则出错。
    }

    function login($su,$sp)
    {
        if (empty($this->smtp))
            return false;
        $res = $this->smtp_cmd("AUTH LOGIN");
        if (intval($res)>400)
            return !$this->errstr = $res;
        $res = $this->smtp_cmd(base64_encode($su));
        if (intval($res)>400)
            return !$this->errstr = $res;
        $res = $this->smtp_cmd(base64_encode($sp));
        if (intval($res)>400)
            return !$this->errstr = $res;
        $this->from = $su;
        return true;
    }
}

class wechatCallbackapiTest
{
	public function valid()
    {
        $echoStr = $_GET["echostr"];

        //valid signature , option
        if($this->checkSignature()){
        	echo $echoStr;
        	exit;
        }
    }

    public function responseMsg()
    {
		//get post data, May be due to the different environments
		$postStr = $GLOBALS["HTTP_RAW_POST_DATA"];

      	//extract post data
		if (!empty($postStr)){
                
              	$postObj = simplexml_load_string($postStr, 'SimpleXMLElement', LIBXML_NOCDATA);
                $fromUsername = $postObj->FromUserName;
                $toUsername = $postObj->ToUserName;
                $type = $postObj->MsgType;
				$event = $postObj->Event;
                $keyword = trim($postObj->Content);
            	if ($type == "image")
                    $pic = $postObj->PicUrl;
                $time = time();
                $textTpl = "<xml>
							<ToUserName><![CDATA[%s]]></ToUserName>
							<FromUserName><![CDATA[%s]]></FromUserName>
							<CreateTime>%s</CreateTime>
							<MsgType><![CDATA[%s]]></MsgType>
							<Content><![CDATA[%s]]></Content>
							<FuncFlag>0</FuncFlag>
							</xml>";
				$picTpl = "<xml>
								 <ToUserName><![CDATA[%s]]></ToUserName>
								 <FromUserName><![CDATA[%s]]></FromUserName>
								 <CreateTime>%s</CreateTime>
								 <MsgType><![CDATA[%s]]></MsgType>
								 <ArticleCount>1</ArticleCount>
								 <Articles>
								 <item>
								 <Title><![CDATA[%s]]></Title> 
								 <Description><![CDATA[%s]]></Description>
								 <PicUrl><![CDATA[%s]]></PicUrl>
								 <Url><![CDATA[%s]]></Url>
								 </item>
								 </Articles>
								 <FuncFlag>1</FuncFlag>
							</xml> ";
				if($type == "event" && $event == "subscribe")
                {
              		$msgType = "text";
                	$contentStr = "<% welcome words here %>";
                	$resultStr = sprintf($textTpl, $fromUsername, $toUsername, $time, $msgType, $contentStr);
                	echo $resultStr;
                }else{
                  	
					$link = memcache_init();

              		$msgType = "text";
                    $key = substr($fromUsername, -5);
                    $contentStr = memcache_get($link, $key);
                    
                    if ($keyword == "0") {
                    	$contentStr = "已经解绑，请输入您的邮箱地址重新绑定：";
                        memcache_set($link, $key, "1943");
                    } else if ($contentStr == false) {
                    	$contentStr = "邮箱未绑定，请输入您的邮箱地址：";
                        memcache_set($link, $key, "1943");
                    } else if ($contentStr == "1943") {
                        $pattern = "/^([0-9A-Za-z\\-_\\.]+)@([0-9a-z]+\\.[a-z]{2,3}(\\.[a-z]{2})?)$/i";
                        if (preg_match($pattern, $keyword)) {
	                        memcache_set($link, $key, $keyword);
                    		$contentStr = "成功绑定邮箱，以后所有消息将自动转发至您的邮箱，回复「0」解绑";
                        } else
                    		$contentStr = "邮箱不合法，请重新输入：";
                    } else {
                        
                        $mail = new cs_smtp('<% smtp server address %>', 25);
                        if ($mail->errstr) 
			            	$contentStr = $mail->errstr;
                        else if (!$mail->login("<% mail address %>", "<% mail password %>"))
                            $contentStr = $mail->errstr;
                        else {
                            if ($type == "image") {
                                $keyword = "图片";
                            }
                            $mail->send($contentStr, "微信转发", "打开此链接查看图片：" . $pic);
	                    	$contentStr = "成功发送「" . $keyword . "」至您的邮箱（回复「0」解绑）";
                        }
                        
                        /*
                        
                        $mail = new SaeMail();

                        $ret = $mail->quickSend($contentStr, "微信转发", $keyword, "shuding.wx@qq.com", "shudingthewechataccount");
                        
                        if ($ret === false) {
	                    	$contentStr = "发送失败，请联系我（回复「0」解绑）";
                        } else
	                    	$contentStr = "成功发送「" . $keyword . "」至您的邮箱（回复「0」解绑）";
                        */
                    }
                   
                	$resultStr = sprintf($textTpl, $fromUsername, $toUsername, $time, $msgType, $contentStr);
                    echo $resultStr;
					
                    /*
              		$msgType = "text";
                    $contentStr = $fromUsername . ": " . $keyword;
                	$resultStr = sprintf($textTpl, $fromUsername, $toUsername, $time, $msgType, $contentStr);
                	echo $resultStr;
                    */
                }
        }else {
        	echo "";
        	exit;
        }
    }
    
	private function checkSignature()
	{
        $signature = $_GET["signature"];
        $timestamp = $_GET["timestamp"];
        $nonce = $_GET["nonce"];	
        		
		$token = TOKEN;
		$tmpArr = array($token, $timestamp, $nonce);
		sort($tmpArr);
		$tmpStr = implode( $tmpArr );
		$tmpStr = sha1( $tmpStr );
		
		if( $tmpStr == $signature ){
			return true;
		}else{
			return false;
		}
	}
	
}
