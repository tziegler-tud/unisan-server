try{
var s_hUa=function(a){this.Mk=a};

}catch(e){_DumpException(e)}
try{
s_h("aLUfP");

var s__m=function(a){s_G.call(this,a.Ka);var b=this;this.window=a.service.window.get();this.wa=this.Mk();this.oa=window.orientation;this.ka=function(){var c=b.Mk(),d=b.xdb()&&90===Math.abs(window.orientation)&&b.oa===-1*window.orientation;b.oa=window.orientation;if(c!==b.wa||d){b.wa=c;d=s_c(b.Yd);for(var e=d.next();!e.done;e=d.next()){e=e.value;var f=new s_hUa(c);try{e(f)}catch(g){s_Kb(g)}}}};this.Yd=new Set;this.window.addEventListener("resize",this.ka);this.xdb()&&this.window.addEventListener("orientationchange",
this.ka)};s_q(s__m,s_G);s__m.kb=s_G.kb;s__m.Ea=function(){return{service:{window:s_yj}}};s__m.prototype.addListener=function(a){this.Yd.add(a)};s__m.prototype.removeListener=function(a){this.Yd.delete(a)};
s__m.prototype.Mk=function(){if(s_iUa()){var a=s_th(this.window);a=new s_ah(a.width,Math.round(a.width*this.window.innerHeight/this.window.innerWidth))}else a=this.kc()||(s_ha()?s_iUa():this.window.visualViewport)?s_th(this.window):new s_ah(this.window.innerWidth,this.window.innerHeight);return a.height<a.width};s__m.prototype.destroy=function(){this.window.removeEventListener("resize",this.ka);this.window.removeEventListener("orientationchange",this.ka)};
var s_iUa=function(){return s_ha()&&s_Ye.aE()&&!navigator.userAgent.includes("GSA")};s__m.prototype.kc=function(){return s_jUa};s__m.prototype.xdb=function(){return"orientation"in window};var s_jUa=!1;s_zj(s_kKa,s__m);

s_jUa=!0;

s_i();

}catch(e){_DumpException(e)}
// Google Inc.
